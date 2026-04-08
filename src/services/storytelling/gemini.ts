import type { Script } from '../video-generation/types';
import { buildPrompt } from './prompts';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

function stripMarkdownFences(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return match ? match[1] : text;
}

export async function generateScript(
  userMessage: string,
  previousScript?: Script
): Promise<Script> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_key_here') {
    throw new Error('Missing Gemini API key. Add VITE_GEMINI_API_KEY to your .env file.');
  }

  const prompt = buildPrompt(userMessage, previousScript);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.9,
        maxOutputTokens: 2048,
      },
    }),
  });

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
