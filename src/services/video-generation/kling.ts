import type { Script, ScriptShot, VideoGenerationResponse } from './types';

const EVOLINK_BASE = 'https://api.evolink.ai/v1';
const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 60;
const MAX_SHOT_PROMPT_CHARS = 512;
const MAX_SHOTS = 6;

function buildShotPrompt(shot: ScriptShot): string {
  let raw = `[${shot.camera}] ${shot.visual}`;
  if (shot.dialogue) {
    raw += ` The character says: "${shot.dialogue}"`;
  }
  if (raw.length <= MAX_SHOT_PROMPT_CHARS) return raw;
  return raw.slice(0, MAX_SHOT_PROMPT_CHARS - 3).replace(/\s+\S*$/, '') + '...';
}

function parseShotDuration(duration: string): string {
  const range = duration.match(/(\d+)-(\d+)/);
  if (range) return String(Number(range[2]) - Number(range[1]));
  const single = duration.match(/(\d+)/);
  if (single) return single[1];
  return '5';
}

function buildMultiPrompt(script: Script) {
  const shots = script.shots.slice(0, MAX_SHOTS);
  return shots.map((shot, i) => {
    let prompt = buildShotPrompt(shot);
    if (i === shots.length - 1 && script.cliffhanger && script.cliffhanger !== 'END') {
      const cliffText = ` The scene ends with: ${script.cliffhanger}`;
      if (prompt.length + cliffText.length <= MAX_SHOT_PROMPT_CHARS) {
        prompt += cliffText;
      }
    }
    return {
      index: i + 1,
      prompt,
      duration: parseShotDuration(shot.duration),
    };
  });
}

function buildCharacterSummary(script: Script): string {
  if (!script.characters?.length) return '';
  return script.characters
    .map((c) => `${c.name} (${c.role}): ${c.appearance}`)
    .join('. ');
}

function buildMainPrompt(script: Script): string {
  const charSummary = buildCharacterSummary(script);
  return charSummary
    ? `${script.title}. Characters: ${charSummary}`.slice(0, 2500)
    : script.title;
}

// Episode 1: text-to-video with multishot
function buildV3TextPayload(script: Script) {
  return {
    model: 'kling-v3-text-to-video',
    prompt: buildMainPrompt(script),
    duration: Math.max(3, Math.min(15, script.duration_seconds)),
    aspect_ratio: script.aspect_ratio || '9:16',
    quality: '720p',
    sound: 'on',
    model_params: {
      multi_shot: true,
      shot_type: 'customize',
      multi_prompt: buildMultiPrompt(script),
    },
  };
}

// Episode 2+: image-to-video with last frame as image_start + multishot
function buildV3ImagePayload(script: Script, lastFrameDataUrl: string) {
  return {
    model: 'kling-v3-image-to-video',
    image_start: lastFrameDataUrl,
    prompt: buildMainPrompt(script),
    duration: Math.max(3, Math.min(15, script.duration_seconds)),
    aspect_ratio: script.aspect_ratio || '9:16',
    quality: '720p',
    sound: 'on',
    model_params: {
      multi_shot: true,
      shot_type: 'customize',
      multi_prompt: buildMultiPrompt(script),
    },
  };
}

async function createTask(
  payload: Record<string, unknown>,
  apiKey: string
): Promise<{ taskId: string; estimatedTime: number }> {
  const res = await fetch(`${EVOLINK_BASE}/videos/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EvoLink API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    taskId: data.id,
    estimatedTime: data.task_info?.estimated_time ?? 180,
  };
}

async function pollTask(
  taskId: string,
  apiKey: string,
  onProgress: (progress: number, message: string) => void
): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(`${EVOLINK_BASE}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`EvoLink poll error (${res.status}): ${text}`);
    }

    const data = await res.json();

    if (data.status === 'completed' && data.results?.length) {
      onProgress(1, 'DONE');
      return data.results[0];
    }

    if (data.status === 'failed') {
      throw new Error(`KLING V3 generation failed: ${JSON.stringify(data)}`);
    }

    const p = (data.progress ?? 0) / 100;
    const phase =
      p < 0.2
        ? 'SUBMITTING TO KLING V3...'
        : p < 0.5
          ? 'GENERATING SHOTS...'
          : p < 0.8
            ? 'RENDERING VIDEO...'
            : 'FINALIZING...';
    onProgress(Math.max(0.05, p), phase);
  }

  throw new Error('KLING V3 generation timed out after 10 minutes');
}

export async function generateVideo(
  script: Script,
  onProgress: (progress: number, message: string) => void,
  lastFrameDataUrl?: string
): Promise<VideoGenerationResponse> {
  const apiKey = import.meta.env.VITE_KLING_API_KEY;
  if (!apiKey || apiKey === 'your_kling_key_here') {
    throw new Error('Missing Kling API key. Add VITE_KLING_API_KEY to your .env file.');
  }

  const isImageToVideo = !!lastFrameDataUrl;
  const startTime = Date.now();

  onProgress(0, isImageToVideo
    ? 'PREPARING V3 IMAGE-TO-VIDEO...'
    : 'PREPARING V3 MULTISHOT REQUEST...');

  const payload = isImageToVideo
    ? buildV3ImagePayload(script, lastFrameDataUrl)
    : buildV3TextPayload(script);

  console.log('[StoryKit] Generate video:', {
    model: isImageToVideo ? 'V3 image-to-video' : 'V3 text-to-video',
    hasLastFrame: isImageToVideo,
    shots: script.shots.length,
  });

  const { taskId } = await createTask(payload, apiKey);
  onProgress(0.05, 'TASK SUBMITTED, GENERATING...');

  const videoUrl = await pollTask(taskId, apiKey, onProgress);

  // V3 720p + sound = 8.1 cr/s
  const rate = 8.1;
  const billedDuration = Math.max(3, Math.min(15, script.duration_seconds));
  const creditsUsed = billedDuration * rate;

  return {
    video_url: videoUrl,
    thumbnail_url: '',
    duration_seconds: script.duration_seconds,
    generation_time_ms: Date.now() - startTime,
    credits_used: creditsUsed,
  };
}
// build 1775845852
