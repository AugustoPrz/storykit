import type { Script, VideoGenerationResponse } from './types';

const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
];

export async function generateVideo(
  script: Script,
  onProgress: (progress: number, message: string) => void
): Promise<VideoGenerationResponse> {
  const totalMs = 3000 + Math.random() * 3000; // 3-6 seconds
  const steps = 20;
  const stepMs = totalMs / steps;

  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, stepMs));
    const progress = i / steps;
    const phase =
      progress < 0.3
        ? 'ANALYZING SCRIPT...'
        : progress < 0.6
          ? `GENERATING ${script.duration_seconds}s CLIP...`
          : progress < 0.9
            ? 'RENDERING FRAMES...'
            : 'FINALIZING...';
    onProgress(progress, phase);
  }

  const videoUrl = SAMPLE_VIDEOS[Math.floor(Math.random() * SAMPLE_VIDEOS.length)];

  return {
    video_url: videoUrl,
    thumbnail_url: '',
    duration_seconds: script.duration_seconds,
    generation_time_ms: totalMs,
  };
}
