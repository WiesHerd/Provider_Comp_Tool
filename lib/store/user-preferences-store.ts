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
    // Auto-save preferences
    const prefs = {
      activeProgramId: programId,
      modelingMode: get().modelingMode,
    };
    saveUserPrefs(prefs);
  },
  
  setModelingMode: (mode: ModelingMode) => {
    set({ modelingMode: mode });
    // Auto-save preferences
    const prefs = {
      activeProgramId: get().activeProgramId,
      modelingMode: mode,
    };
    saveUserPrefs(prefs);
  },
  
  loadPreferences: () => {
    const prefs = loadUserPrefs();
    set({
      activeProgramId: prefs.activeProgramId,
      modelingMode: prefs.modelingMode,
    });
  },
}));





