import { create } from 'zustand';
import { HistoryEntry } from '../types';
import { driveService } from '../modules/drive/DriveService';

interface HistoryState {
  history: HistoryEntry[];
  isLoading: boolean;
  error: string | null;
  filter: 'all' | 'note' | 'task';
  loadHistory: () => Promise<void>;
  setFilter: (filter: 'all' | 'note' | 'task') => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  history: [],
  isLoading: false,
  error: null,
  filter: 'all',

  loadHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const history = await driveService.loadHistory();
      set({ history, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load history',
      });
    }
  },

  setFilter: (filter) => {
    set({ filter });
  },
}));