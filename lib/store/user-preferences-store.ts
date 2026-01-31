/**
 * User Preferences Store
 * 
 * Zustand store for managing user preferences (activeProgramId, modelingMode)
 */

import { create } from 'zustand';
import { ModelingMode } from '@/types/call-pay';
import { loadUserPrefs, saveUserPrefs } from '@/lib/utils/storageClient';

interface UserPreferencesState {
  activeProgramId: string | null;
  modelingMode: ModelingMode;
  
  // Actions
  setActiveProgram: (programId: string | null) => void;
  setModelingMode: (mode: ModelingMode) => void;
  loadPreferences: () => void;
}

export const useUserPreferencesStore = create<UserPreferencesState>()((set, get) => ({
  activeProgramId: null,
  modelingMode: 'quick',
  
  setActiveProgram: (programId: string | null) => {
    set({ activeProgramId: programId });
    // Auto-save preferences (async, fire and forget)
    const prefs = {
      activeProgramId: programId,
      modelingMode: get().modelingMode,
    };
    void saveUserPrefs(prefs);
  },
  
  setModelingMode: (mode: ModelingMode) => {
    set({ modelingMode: mode });
    // Auto-save preferences (async, fire and forget)
    const prefs = {
      activeProgramId: get().activeProgramId,
      modelingMode: mode,
    };
    void saveUserPrefs(prefs);
  },
  
  loadPreferences: async () => {
    const prefs = await loadUserPrefs();
    set({
      activeProgramId: prefs.activeProgramId,
      modelingMode: prefs.modelingMode,
    });
  },
}));























