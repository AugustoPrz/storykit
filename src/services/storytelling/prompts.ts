import type { Script } from '../video-generation/types';

const SYSTEM_PROMPT = `You are a cinematic story writer that creates structured scripts for short video clips (3-16 seconds). You MUST respond with ONLY a valid JSON object — no markdown, no preamble, no explanation.

The JSON must match this exact schema:
{
  "title": "string — short evocative title",
  "duration_seconds": number between 3 and 16,
  "shots": [
    {
      "shot_number": 1,
      "duration": "string — e.g. '0-5s'",
      "visual": "string — detailed visual description for video gen model, include camera movement, lighting, mood",
      "audio": "string — sound effects, music mood, dialogue if any",
      "camera": "string — e.g. 'slow dolly in', 'static wide', 'tracking shot'"
    }
  ],
  "cliffhanger": "string — how this clip ends (tension, surprise, question)",
  "hook_for_next": "string — teaser for potential continuation",
  "style": "string — overall visual style: cinematic, anime, noir, fantasy, etc.",
  "aspect_ratio": "9:16"
}

Rules:
- Generate 2-4 shots that tell a compelling micro-story
- Each shot should have rich visual detail for a video generation AI
- End with a strong cliffhanger that makes the viewer want more
- The style should match the mood of the story
- Always use aspect_ratio "9:16" (vertical video)`;

export function buildPrompt(userMessage: string, previousScript?: Script): string {
  if (previousScript) {
    return `${SYSTEM_PROMPT}

CONTEXT — Previous episode script:
${JSON.stringify(previousScript, null, 2)}

Generate the NEXT episode of this story. Maintain the same characters, setting, and visual style "${previousScript.style}". Advance the plot past the previous cliffhanger: "${previousScript.cliffhanger}". End with a NEW cliffhanger.

User request: ${userMessage}`;
  }

  return `${SYSTEM_PROMPT}

Create a script for this story idea: ${userMessage}`;
}
