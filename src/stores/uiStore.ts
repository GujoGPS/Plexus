import { create } from 'zustand';

export type ViewType = 'calendario' | 'notas' | 'todo';

interface UiState {
  zenMode: boolean;
  toggleZenMode: () => void;
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  activeEntityId: string | null;
  navigateToItem: (view: ViewType, entityId: string) => void;
  clearActiveEntity: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  zenMode: false,
  toggleZenMode: () =>
    set((state) => ({
      zenMode: !state.zenMode,
    })),
    
  activeView: 'calendario',
  
  setActiveView: (view) => 
    set({ activeView: view, activeEntityId: null }),
    
  activeEntityId: null,
  
  navigateToItem: (view, entityId) => 
    set({ activeView: view, activeEntityId: entityId }),
    
  clearActiveEntity: () => 
    set({ activeEntityId: null }),
}));