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
  return script.shots.slice(0, MAX_SHOTS).map((shot, i) => ({
    index: i + 1,
    prompt: buildShotPrompt(shot),
    duration: parseShotDuration(shot.duration),
  }));
}

function buildCharacterSummary(script: Script): string {
  if (!script.characters?.length) return '';
  return script.characters
    .map((c) => `${c.name} (${c.role}): ${c.appearance}`)
    .join('. ');
}

function buildV3Payload(script: Script) {
  const charSummary = buildCharacterSummary(script);
  const prompt = charSummary
    ? `${script.title}. Characters: ${charSummary}`.slice(0, 2500)
    : script.title;
  return {
    model: 'kling-v3-text-to-video',
    prompt,
    duration: Math.max(3, Math.min(10, script.duration_seconds)),
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

function buildO3Payload(script: Script, referenceVideoUrl: string) {
  const charSummary = buildCharacterSummary(script);
  const shotPrompts = script.shots
    .slice(0, MAX_SHOTS)
    .map((s) => buildShotPrompt(s))
    .join(' | ');
  const raw = charSummary
    ? `Characters: ${charSummary}. Shots: ${shotPrompts}`
    : shotPrompts;
  const prompt = raw.length > 2500 ? raw.slice(0, 2497) + '...' : raw;

  return {
    model: 'kling-o3-reference-to-video',
    prompt,
    video_url: referenceVideoUrl,
    keep_original_sound: false,
    duration: Math.max(3, Math.min(10, script.duration_seconds)),
    aspect_ratio: script.aspect_ratio || '9:16',
    quality: '720p',
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
  onProgress: (progress: number, message: string) => void,
  isO3: boolean
): Promise<string> {
  const label = isO3 ? 'KLING O3' : 'KLING V3';

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
      throw new Error(`${label} generation failed: ${JSON.stringify(data)}`);
    }

    const p = (data.progress ?? 0) / 100;
    const phase =
      p < 0.2
        ? `SUBMITTING TO ${label}...`
        : p < 0.5
          ? 'GENERATING SHOTS...'
          : p < 0.8
            ? 'RENDERING VIDEO...'
            : 'FINALIZING...';
    onProgress(Math.max(0.05, p), phase);
  }

  throw new Error(`${label} generation timed out after 10 minutes`);
}

export async function generateVideo(
  script: Script,
  onProgress: (progress: number, message: string) => void,
  referenceVideoUrl?: string
): Promise<VideoGenerationResponse> {
  const apiKey = import.meta.env.VITE_KLING_API_KEY;
  if (!apiKey || apiKey === 'your_kling_key_here') {
    throw new Error('Missing Kling API key. Add VITE_KLING_API_KEY to your .env file.');
  }

  const isO3 = !!referenceVideoUrl;
  const startTime = Date.now();

  onProgress(0, isO3 ? 'PREPARING O3 REFERENCE REQUEST...' : 'PREPARING V3 MULTISHOT REQUEST...');

  const payload = isO3
    ? buildO3Payload(script, referenceVideoUrl)
    : buildV3Payload(script);

  const { taskId } = await createTask(payload, apiKey);
  onProgress(0.05, 'TASK SUBMITTED, GENERATING...');

  const videoUrl = await pollTask(taskId, apiKey, onProgress, isO3);

  // V3 720p + sound = 8.1 cr/s, O3 720p = 8.1 cr/s
  const rate = 8.1;
  const maxDuration = isO3 ? 10 : 10;
  const billedDuration = Math.max(3, Math.min(maxDuration, script.duration_seconds));
  const creditsUsed = billedDuration * rate;

  return {
    video_url: videoUrl,
    thumbnail_url: '',
    duration_seconds: script.duration_seconds,
    generation_time_ms: Date.now() - startTime,
    credits_used: creditsUsed,
  };
}
