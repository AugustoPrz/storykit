import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClipMetadata, ChatMessage, GenerationStatus } from '../services/video-generation/types';

interface ClipsState {
  clips: ClipMetadata[];
  chatMessages: ChatMessage[];
  generationStatus: GenerationStatus;
  currentClipId: string | null;

  addClip: (clip: ClipMetadata) => void;
  updateClip: (id: string, updates: Partial<ClipMetadata>) => void;
  removeClip: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearChat: () => void;
  setGenerationStatus: (status: GenerationStatus) => void;
  setCurrentClipId: (id: string | null) => void;
}

export const useClipsStore = create<ClipsState>()(
  persist(
    (set) => ({
      clips: [],
      chatMessages: [],
      generationStatus: { phase: 'idle', progress: 0, message: '' },
      currentClipId: null,

      addClip: (clip) =>
        set((state) => ({ clips: [clip, ...state.clips] })),

      updateClip: (id, updates) =>
        set((state) => ({
          clips: state.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      removeClip: (id) =>
        set((state) => ({ clips: state.clips.filter((c) => c.id !== id) })),

      addMessage: (message) =>
        set((state) => ({ chatMessages: [...state.chatMessages, message] })),

      updateMessage: (id, updates) =>
        set((state) => ({
          chatMessages: state.chatMessages.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      clearChat: () =>
        set({ chatMessages: [], generationStatus: { phase: 'idle', progress: 0, message: '' }, currentClipId: null }),

      setGenerationStatus: (status) =>
        set({ generationStatus: status }),

      setCurrentClipId: (id) =>
        set({ currentClipId: id }),
    }),
    {
      name: 'storykit-clips',
      partialize: (state) => ({ clips: state.clips }),
    }
  )
);
