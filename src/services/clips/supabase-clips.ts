import { supabase } from '../auth/supabase';
import type { ClipMetadata } from '../video-generation/types';

// DB row shape — snake_case columns
interface ClipRow {
  id: string;
  user_id: string;
  title: string | null;
  prompt: string | null;
  script: ClipMetadata['script'] | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  style: string | null;
  parent_clip_id: string | null;
  reference_image_url: string | null;
  created_at: string;
}

function rowToClip(row: ClipRow): ClipMetadata {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title ?? '',
    prompt: row.prompt ?? '',
    script: row.script as ClipMetadata['script'],
    videoUrl: row.video_url ?? '',
    thumbnailUrl: row.thumbnail_url ?? '',
    duration: row.duration ?? 0,
    createdAt: row.created_at,
    style: row.style ?? '',
    parentClipId: row.parent_clip_id ?? undefined,
    referenceImageUrl: row.reference_image_url ?? undefined,
  };
}

function clipToRow(clip: ClipMetadata, userId: string): Omit<ClipRow, 'created_at'> {
  return {
    id: clip.id,
    user_id: userId,
    title: clip.title,
    prompt: clip.prompt,
    script: clip.script,
    video_url: clip.videoUrl || null,
    thumbnail_url: clip.thumbnailUrl || null,
    duration: clip.duration,
    style: clip.style,
    parent_clip_id: clip.parentClipId || null,
    reference_image_url: clip.referenceImageUrl || null,
  };
}

// All clips with a video (public feed)
export async function fetchPublicClips(limit = 100): Promise<ClipMetadata[]> {
  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .not('video_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[supabase-clips] fetchPublicClips error', error);
    return [];
  }
  return (data as ClipRow[]).map(rowToClip);
}

// All clips owned by a user (including drafts)
export async function fetchUserClips(userId: string): Promise<ClipMetadata[]> {
  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[supabase-clips] fetchUserClips error', error);
    return [];
  }
  return (data as ClipRow[]).map(rowToClip);
}

// Root clips (story starters) for the user — for history dropdown
export async function fetchUserStories(userId: string): Promise<ClipMetadata[]> {
  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('user_id', userId)
    .is('parent_clip_id', null)
    .not('video_url', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[supabase-clips] fetchUserStories error', error);
    return [];
  }
  return (data as ClipRow[]).map(rowToClip);
}

// Fetch a story chain: root + descendants (by walking parent_clip_id refs)
export async function fetchStoryChain(rootId: string, userId: string): Promise<ClipMetadata[]> {
  const { data, error } = await supabase
    .from('clips')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('[supabase-clips] fetchStoryChain error', error);
    return [];
  }

  const all = (data as ClipRow[]).map(rowToClip);
  const byId = new Map(all.map((c) => [c.id, c]));
  // Walk forward from root by finding children
  const chain: ClipMetadata[] = [];
  const root = byId.get(rootId);
  if (!root) return [];
  chain.push(root);

  // Breadth-first: follow any clips whose parent is in the chain
  let currentIds = new Set([rootId]);
  while (currentIds.size > 0) {
    const nextChildren = all.filter((c) => c.parentClipId && currentIds.has(c.parentClipId));
    if (nextChildren.length === 0) break;
    // Sort by createdAt ascending within this level
    nextChildren.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    chain.push(...nextChildren);
    currentIds = new Set(nextChildren.map((c) => c.id));
  }

  return chain;
}

export async function insertClip(clip: ClipMetadata, userId: string): Promise<void> {
  const row = clipToRow(clip, userId);
  const { error } = await supabase.from('clips').insert(row);
  if (error) {
    console.error('[supabase-clips] insertClip error', error);
  }
}

export async function updateClip(id: string, patch: Partial<ClipMetadata>): Promise<void> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.prompt !== undefined) dbPatch.prompt = patch.prompt;
  if (patch.script !== undefined) dbPatch.script = patch.script;
  if (patch.videoUrl !== undefined) dbPatch.video_url = patch.videoUrl || null;
  if (patch.thumbnailUrl !== undefined) dbPatch.thumbnail_url = patch.thumbnailUrl || null;
  if (patch.duration !== undefined) dbPatch.duration = patch.duration;
  if (patch.style !== undefined) dbPatch.style = patch.style;
  if (patch.referenceImageUrl !== undefined) dbPatch.reference_image_url = patch.referenceImageUrl || null;

  const { error } = await supabase.from('clips').update(dbPatch).eq('id', id);
  if (error) {
    console.error('[supabase-clips] updateClip error', error);
  }
}

export async function deleteClip(id: string): Promise<void> {
  const { error } = await supabase.from('clips').delete().eq('id', id);
  if (error) {
    console.error('[supabase-clips] deleteClip error', error);
  }
}
