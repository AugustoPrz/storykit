import type { Script } from '../video-generation/types';

const SYSTEM_PROMPT = `You are a cinematic story writer and director that creates structured scripts for short AI-generated video clips. You MUST respond with ONLY a valid JSON object — no markdown, no preamble, no explanation.

The JSON must match this exact schema:
{
  "title": "string — short evocative title",
  "duration_seconds": number between 5 and 10,
  "shots": [
    {
      "shot_number": 1,
      "duration": "string — e.g. '0-5s'",
      "visual": "string — detailed visual description for video gen model, include lighting, mood, action",
      "audio": "string — narration, dialogue, sound effects, music mood. MUST include voice/narration.",
      "camera": "string — e.g. 'slow dolly in', 'static wide', 'tracking shot'"
    }
  ],
  "cliffhanger": "string — how this clip ends (tension, surprise, question)",
  "hook_for_next": "string — teaser for potential continuation",
  "style": "string — overall visual style: cinematic, anime, noir, fantasy, etc.",
  "aspect_ratio": "9:16"
}

DIRECTING RULES — follow these strictly:
- Target 5-10 seconds total. Only go up to 10s if the story demands it. Shorter is better.
- Use 1 to 4 shots. Let the story decide:
  - 1 shot: a simple mood piece or establishing moment
  - 2 shots: setup + payoff
  - 3-4 shots: a full micro-narrative with rising tension
- CAMERA MUST FOLLOW THE ACTION: if a character faces danger ahead, the camera should show the danger or the character's reaction from the front — never show the back of their head during a climactic moment. Cut to a frontal close-up for emotional beats. The camera is your audience's eyes.
- SHOT TRANSITIONS MUST BE MOTIVATED: each cut should happen because the story demands a new perspective (reveal, reaction, escalation), not arbitrarily.
- AUDIO IS MANDATORY: every shot must have voice narration, dialogue, or a strong sound design description. The generated video will have audio — use it.
- End with a strong cliffhanger that makes the viewer want more
- The style should match the mood of the story
- Always use aspect_ratio "9:16" (vertical video)
- Each shot's visual description should be self-contained and detailed enough for an AI video generator to produce it without additional context`;

export function buildPrompt(
  userMessage: string,
  previousScript?: Script,
  episodeNumber?: number
): string {
  if (previousScript) {
    const ep = episodeNumber ?? 2;
    return `${SYSTEM_PROMPT}

CONTEXT — Previous episode script (Episode ${ep - 1}):
${JSON.stringify(previousScript, null, 2)}

CONTINUATION RULES — these are mandatory:
1. TITLE: Use the SAME base title "${previousScript.title}" and append " — Part ${ep}" (e.g. "${previousScript.title} — Part ${ep}")
2. CHARACTERS: The SAME characters must appear. Describe them with the EXACT same physical appearance (clothing, hair, face, body type) as the previous episode so the video AI generates consistent-looking people.
3. SETTING: Continue in the same location or a directly connected space. Describe the environment consistently.
4. STYLE: Use the exact same visual style "${previousScript.style}".
5. PLOT: Pick up DIRECTLY from the cliffhanger: "${previousScript.cliffhanger}". The first shot must be the immediate next moment — do not skip time or reset the scene.
6. End with a NEW cliffhanger.

User request: ${userMessage}`;
  }

  return `${SYSTEM_PROMPT}

Create a script for this story idea: ${userMessage}`;
}
