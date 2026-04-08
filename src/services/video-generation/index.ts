import type { Script, VideoGenerationResponse } from './types';
import { generateVideo as klingGenerate } from './kling';
import { generateVideo as mockGenerate } from './mock';

export async function generateVideo(
  script: Script,
  onProgress: (progress: number, message: string) => void,
  referenceVideoUrl?: string
): Promise<VideoGenerationResponse> {
  const apiKey = import.meta.env.VITE_KLING_API_KEY;
  if (apiKey && apiKey !== 'your_kling_key_here') {
    return klingGenerate(script, onProgress, referenceVideoUrl);
  }
  console.warn('[StoryKit] No VITE_KLING_API_KEY found, using mock video service');
  return mockGenerate(script, onProgress);
}
