import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PromptState {
  prompt: string;
  lyrics: string;
  hasVocals: boolean;
  duration: number;
  styleStrength: number;
  genre: string;
  key: string;
  referenceFileId?: number;
  recentPrompts: string[];

  // Actions
  setPrompt: (prompt: string) => void;
  setLyrics: (lyrics: string) => void;
  setHasVocals: (hasVocals: boolean) => void;
  setDuration: (duration: number) => void;
  setStyleStrength: (strength: number) => void;
  setGenre: (genre: string) => void;
  setKey: (key: string) => void;
  setReferenceFileId: (id?: number) => void;
  addRecentPrompt: (prompt: string) => void;
  clearRecentPrompts: () => void;
  reset: () => void;
}

const initialState = {
  prompt: "",
  lyrics: "",
  hasVocals: false,
  duration: 60,
  styleStrength: 50,
  genre: "",
  key: "",
  referenceFileId: undefined,
  recentPrompts: [],
};

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
      ...initialState,

      setPrompt: (prompt) => set({ prompt }),
      setLyrics: (lyrics) => set({ lyrics }),
      setHasVocals: (hasVocals) => set({ hasVocals }),
      setDuration: (duration) => set({ duration }),
      setStyleStrength: (styleStrength) => set({ styleStrength }),
      setGenre: (genre) => set({ genre }),
      setKey: (key) => set({ key }),
      setReferenceFileId: (referenceFileId) => set({ referenceFileId }),

      addRecentPrompt: (prompt) =>
        set((state) => {
          const filtered = state.recentPrompts.filter((p) => p !== prompt);
          const updated = [prompt, ...filtered].slice(0, 10); // Keep last 10
          return { recentPrompts: updated };
        }),

      clearRecentPrompts: () => set({ recentPrompts: [] }),

      reset: () => set(initialState),
    }),
    {
      name: "prompt-store",
      partialize: (state) => ({
        recentPrompts: state.recentPrompts,
      }),
    }
  )
);
