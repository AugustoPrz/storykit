import type { Script } from '../video-generation/types';
import { buildPrompt } from './prompts';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

function stripMarkdownFences(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : text;
}

export async function generateScript(
  userMessage: string,
  previousScript?: Script,
  episodeNumber?: number
): Promise<Script> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_key_here') {
    throw new Error('Missing Gemini API key. Add VITE_GEMINI_API_KEY to your .env file.');
  }

  const prompt = buildPrompt(userMessage, previousScript, episodeNumber);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.9,
      maxOutputTokens: 4096,
    },
  });

  let lastError = '';
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.status === 503) {
      lastError = `Gemini API overloaded (503), retry ${attempt + 1}/${MAX_RETRIES}...`;
      continue;
    }

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Empty response from Gemini');
    }

    const cleaned = stripMarkdownFences(rawText.trim());

    try {
      const script: Script = JSON.parse(cleaned);
      if (!script.title || !script.shots || !Array.isArray(script.shots)) {
        throw new Error('Invalid script structure');
      }
      return script;
    } catch {
      throw new Error(`Failed to parse Gemini response as JSON: ${cleaned.slice(0, 200)}`);
    }
  }

  throw new Error(lastError || 'Gemini API unavailable after retries');
}
