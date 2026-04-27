// Local: MyApp/src/stores/settingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  geminiApiKey: string | null;
  setGeminiApiKey: (key: string | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geminiApiKey: null,
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
    }),
    {
      name: 'plexus-settings', // Nome da chave no localStorage
    }
  )
);