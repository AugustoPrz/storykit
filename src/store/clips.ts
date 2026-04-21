import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClipMetadata, ChatMessage, GenerationStatus } from '../services/video-generation/types';
import {
  fetchPublicClips,
  fetchUserClips,
  insertClip as supaInsertClip,
  updateClip as supaUpdateClip,
  deleteClip as supaDeleteClip,
} from '../services/clips/supabase-clips';

interface ClipsState {
  // Session drafts (local only, not persisted past clearChat)
  clips: ClipMetadata[];
  // All clips from Supabase (public feed — includes the user's own when logged in)
  publicClips: ClipMetadata[];
  // User's own clips (loaded when logged in, used for Mine filter + history)
  userClips: ClipMetadata[];

  chatMessages: ChatMessage[];
  generationStatus: GenerationStatus;
  currentClipId: string | null;
  creditsUsed: number;

  addClip: (clip: ClipMetadata, userId?: string) => void;
  updateClip: (id: string, updates: Partial<ClipMetadata>) => void;
  removeClip: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearChat: () => void;
  setGenerationStatus: (status: GenerationStatus) => void;
  setCurrentClipId: (id: string | null) => void;
  addCredits: (amount: number) => void;

  loadPublicClips: () => Promise<void>;
  loadUserClips: (userId: string) => Promise<void>;
  clearUserClips: () => void;
}

export const useClipsStore = create<ClipsState>()(
  persist(
    (set, get) => ({
      clips: [],
      publicClips: [],
      userClips: [],
      chatMessages: [],
      generationStatus: { phase: 'idle', progress: 0, message: '' },
      currentClipId: null,
      creditsUsed: 0,

      addClip: (clip, userId) => {
        const withOwner = userId ? { ...clip, userId } : clip;
        set((state) => ({ clips: [withOwner, ...state.clips] }));
        // Only persist to Supabase when this is a NEW owned clip with a video
        const alreadyInDb = get().userClips.some((c) => c.id === withOwner.id);
        if (withOwner.videoUrl && userId && !alreadyInDb) {
          supaInsertClip(withOwner, userId).catch((e) => console.error('[store] insert failed', e));
        }
      },

      updateClip: (id, updates) => {
        set((state) => ({
          clips: state.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
          userClips: state.userClips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));

        const clip = get().clips.find((c) => c.id === id);
        if (!clip) return;

        // Persist to Supabase when clip has user + video
        if (clip.userId && (clip.videoUrl || updates.videoUrl)) {
          // If we're just now getting a videoUrl for the first time, insert instead of update
          const isFirstVideo = updates.videoUrl && !get().userClips.find((c) => c.id === id);
          if (isFirstVideo) {
            const full = { ...clip, ...updates };
            supaInsertClip(full, clip.userId).catch((e) => console.error('[store] insert failed', e));
            set((state) => ({ userClips: [full, ...state.userClips] }));
          } else {
            supaUpdateClip(id, updates).catch((e) => console.error('[store] update failed', e));
          }
        }
      },

      removeClip: (id) => {
        const clip = get().clips.find((c) => c.id === id) || get().userClips.find((c) => c.id === id);
        set((state) => ({
          clips: state.clips.filter((c) => c.id !== id),
          userClips: state.userClips.filter((c) => c.id !== id),
          publicClips: state.publicClips.filter((c) => c.id !== id),
        }));
        if (clip?.userId && clip.videoUrl) {
          supaDeleteClip(id).catch((e) => console.error('[store] delete failed', e));
        }
      },

      addMessage: (message) =>
        set((state) => ({ chatMessages: [...state.chatMessages, message] })),

      updateMessage: (id, updates) =>
        set((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      clearChat: () =>
        set((state) => ({
          chatMessages: [],
          generationStatus: { phase: 'idle', progress: 0, message: '' },
          currentClipId: null,
          // Remove draft clips (no video) from local session
          clips: state.clips.filter((c) => c.videoUrl),
        })),

      setGenerationStatus: (status) =>
        set({ generationStatus: status }),

      setCurrentClipId: (id) =>
        set({ currentClipId: id }),

      addCredits: (amount) =>
        set((state) => ({ creditsUsed: state.creditsUsed + amount })),

      loadPublicClips: async () => {
        const clips = await fetchPublicClips();
        set({ publicClips: clips });
      },

      loadUserClips: async (userId) => {
        const clips = await fetchUserClips(userId);
        set({ userClips: clips });
      },

      clearUserClips: () => set({ userClips: [] }),
    }),
    {
      name: 'dramamix-clips',
      partialize: (state) => ({ creditsUsed: state.creditsUsed }),
    }
  )
);
