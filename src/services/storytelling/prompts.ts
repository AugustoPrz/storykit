import type { Script } from '../video-generation/types';

const NAME_POOLS = [
  ['Bryce', 'Cassandra', 'Wyatt', 'Jocelyn', 'Trent', 'Morgan', 'Devin', 'Shelby'],
  ['Carter', 'Naomi', 'Wesley', 'Autumn', 'Malik', 'Brooklyn', 'Travis', 'Kendra'],
  ['Garrett', 'Vivian', 'Colton', 'Paige', 'Donovan', 'Sienna', 'Reed', 'Camille'],
  ['Tomás', 'Valentina', 'Santiago', 'Lucía', 'Andrés', 'Renata', 'Diego', 'Catalina'],
  ['Mateo', 'Isabella', 'Rodrigo', 'Camila', 'Emilio', 'Fernanda', 'Nicolás', 'Sofía'],
  ['Dante', 'Chiara', 'Luca', 'Ingrid', 'Soren', 'Maren', 'Viktor', 'Lena'],
  ['Hugo', 'Margaux', 'Álvaro', 'Céline', 'Adrián', 'Eloise', 'Marcel', 'Nadia'],
];

function getNameHint(): string {
  const pool = NAME_POOLS[Math.floor(Math.random() * NAME_POOLS.length)];
  const picked = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return `Use diverse, global names. For this story, consider names like: ${picked.join(', ')}. Avoid overused names like Julian, Maya, Elena, Marcus, Leo, Sophie.`;
}

const SYSTEM_PROMPT = `You are a cinematic DRAMA writer and director. Every story you create must be rooted in DRAMA — emotional conflict, betrayal, secrets, tension between characters, moral dilemmas, power struggles, or heartbreak. Even if the setting is sci-fi, fantasy, or thriller, the core must always be a dramatic human story with high emotional stakes. Think DramaBox, telenovela intensity, K-drama cliffhangers.

You create structured scripts for short AI-generated video clips. You MUST respond with ONLY a valid JSON object — no markdown, no preamble, no explanation.

The JSON must match this exact schema:
{
  "title": "string — short evocative title",
  "duration_seconds": number between 5 and 10,
  "characters": [
    {
      "name": "string — character name",
      "role": "string — protagonist, antagonist, supporting, etc.",
      "appearance": "string — VERY detailed physical description: gender, age range, ethnicity, hair color/style/length, eye color, face shape, build, exact clothing with colors and details, distinguishing features (scars, tattoos, glasses, beard, etc). Be SPECIFIC enough that an AI video generator produces the same person every time. Example: 'Woman, early 30s, East Asian, long straight black hair past shoulders, dark brown eyes, oval face, slim build, wearing a fitted navy blue blazer over white silk blouse, small gold stud earrings'"
    }
  ],
  "shots": [
    {
      "shot_number": 1,
      "duration": "string — e.g. '0-5s'",
      "visual": "string — detailed visual description. IMPORTANT: when a character appears, reference them by name AND repeat their key appearance details (hair, clothing, build) so the video AI generates them consistently",
      "audio": "string — sound effects, ambient sounds, music mood",
      "camera": "string — e.g. 'slow dolly in', 'static wide', 'tracking shot'",
      "dialogue": "string or null — exact spoken words by a character in this shot, e.g. '\"No... that can't be right.\"' or null if no dialogue in this shot"
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
- PHONE/DEVICE SCENES: when a character looks at a phone, letter, screen, or any object — NEVER show the phone screen facing the camera while the character faces away. Either show the character's face reacting (frontal close-up) OR show the device from the character's POV (over-shoulder or first-person perspective). The audience should see the emotion, not the back of someone's head.
- SHOT TRANSITIONS MUST BE MOTIVATED: each cut should happen because the story demands a new perspective (reveal, reaction, escalation), not arbitrarily.
- DIALOGUE IS MANDATORY: at least ONE shot must have a non-null "dialogue" field with exact spoken words from a character. Characters should talk — whisper, shout, cry, confess. KEEP DIALOGUE SHORT — max 8 words per line. Think punchy, dramatic fragments: "You weren't supposed to find this.", "Run. Now.", "I know what you did." Short dialogue hits harder and works better with AI video generation.
- End with a strong cliffhanger that makes the viewer want more
- The style should match the mood of the story
- Always use aspect_ratio "9:16" (vertical video)
- Each shot's visual description should be self-contained and detailed enough for an AI video generator to produce it without additional context`;

function getBaseTitle(title: string): string {
  return title.replace(/\s*—\s*Part\s*\d+$/i, '').trim();
}

export function buildPrompt(
  userMessage: string,
  previousScript?: Script,
  episodeNumber?: number,
  isFinalEpisode?: boolean
): string {
  if (previousScript) {
    const ep = episodeNumber ?? 2;
    const baseTitle = getBaseTitle(previousScript.title);

    const episodeRole = isFinalEpisode
      ? `This is the FINAL EPISODE. You MUST:
- Resolve the central dramatic conflict — give the audience a satisfying or shocking conclusion
- Do NOT end with a cliffhanger. Set "cliffhanger" to "END" and "hook_for_next" to "END"
- Deliver the emotional payoff: confession, confrontation, revelation, or consequence
- Make the last shot feel like a dramatic finale — a door closing, a face in tears, walking away, silence after the storm`
      : `This is Episode ${ep} (continuation). You MUST:
- Escalate the tension significantly from the previous episode
- Introduce a twist, betrayal, or revelation that changes everything
- End with an even STRONGER cliffhanger than the previous episode`;

    return `${SYSTEM_PROMPT}

CONTEXT — Previous episode script (Episode ${ep - 1}):
${JSON.stringify(previousScript, null, 2)}

EPISODE STRUCTURE: ${episodeRole}

CONTINUATION RULES — these are mandatory:
1. TITLE: Use "${baseTitle} — Part ${ep}" as the title. Do NOT stack part numbers.
2. CHARACTERS: Copy the "characters" array from the previous episode EXACTLY — same names, same roles, same appearance strings word-for-word. Do NOT change any character's appearance. If adding a new character, append them to the array. In every shot's "visual" field, when a character appears, always mention their name and repeat their key visual traits (hair, clothing, build) so the AI video generator renders them identically.
3. SETTING: Continue in the same location or a directly connected space. Describe the environment consistently.
4. STYLE: Use the exact same visual style "${previousScript.style}".
5. PLOT: Pick up DIRECTLY from the cliffhanger: "${previousScript.cliffhanger}". The first shot must be the immediate next moment — do not skip time or reset the scene.

User request: ${userMessage}`;
  }

  return `${SYSTEM_PROMPT}

${getNameHint()}

This is Episode 1 of a drama series. Set up compelling characters, a dramatic situation, and end with a strong cliffhanger that demands a continuation.

Create a script for this story idea: ${userMessage}`;
}
