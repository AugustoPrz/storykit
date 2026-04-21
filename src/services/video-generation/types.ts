export interface ScriptShot {
  shot_number: number;
  duration: string;
  visual: string;
  audio: string;
  camera: string;
  dialogue?: string;
}

export interface ScriptCharacter {
  name: string;
  role: string;
  appearance: string;
}

export interface Script {
  title: string;
  genre?: string;
  duration_seconds: number;
  characters: ScriptCharacter[];
  shots: ScriptShot[];
  cliffhanger: string;
  hook_for_next: string;
  style: string;
  mood?: string;
  aspect_ratio: string;
}

export interface ClipMetadata {
  id: string;
  userId?: string;
  title: string;
  prompt: string;
  script: Script;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  createdAt: string;
  style: string;
  parentClipId?: string;
  referenceImageUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  clipId?: string;
  script?: Script;
}

export interface GenerationStatus {
  phase: 'idle' | 'scripting' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface VideoGenerationRequest {
  prompt: string;
  duration: number;
  aspect_ratio: '9:16' | '16:9' | '1:1';
  mode: 'standard' | 'pro';
  audio: boolean;
}

export interface VideoGenerationResponse {
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  generation_time_ms: number;
  credits_used?: number;
}
