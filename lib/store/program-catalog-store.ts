/**
 * Program Catalog Store
 * 
 * Zustand store for managing call programs and shift types
 */

import { create } from 'zustand';
import { CallProgram, ShiftType } from '@/types/call-program';
import { loadProgramCatalog, saveProgramCatalog } from '@/lib/utils/storageClient';
import { useUserPreferencesStore } from './user-preferences-store';

interface ProgramCatalogState {
  programs: CallProgram[];
  shiftTypes: ShiftType[];
  
  // Actions
  loadInitialData: () => void;
  
  // Shift Type actions
  addShiftType: (shiftType: ShiftType) => void;
  updateShiftType: (id: string, updates: Partial<ShiftType>) => void;
  deleteShiftType: (id: string) => void;
  getShiftType: (id: string) => ShiftType | undefined;
  
  // Program actions
  addProgram: (program: CallProgram) => void;
  updateProgram: (id: string, updates: Partial<CallProgram>) => void;
  deleteProgram: (id: string) => void;
  getProgram: (id: string) => CallProgram | undefined;
}

export const useProgramCatalogStore = create<ProgramCatalogState>()((set, get) => ({
  programs: [],
  shiftTypes: [],
  
  loadInitialData: async () => {
    const catalog = await loadProgramCatalog();
    set({
      programs: catalog.programs.filter(p => !p.isDeleted),
      shiftTypes: catalog.shiftTypes.filter(st => !st.isDeleted),
    });
  },
  
  addShiftType: async (shiftType: ShiftType) => {
    const now = new Date().toISOString();
    const newShiftType: ShiftType = {
      ...shiftType,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
    
    const state = get();
    const updated = [...state.shiftTypes, newShiftType];
    await saveProgramCatalog({
      programs: state.programs,
      shiftTypes: updated,
    });
    set({ shiftTypes: updated });
  },
  
  updateShiftType: async (id: string, updates: Partial<ShiftType>) => {
    const state = get();
    const updated = state.shiftTypes.map(st =>
      st.id === id
        ? { ...st, ...updates, updatedAt: new Date().toISOString() }
        : st
    );
    await saveProgramCatalog({
      programs: state.programs,
      shiftTypes: updated,
    });
    set({ shiftTypes: updated });
  },
  
  deleteShiftType: (id: string) => {
    get().updateShiftType(id, { isDeleted: true });
  },
  
  getShiftType: (id: string) => {
    return get().shiftTypes.find(st => st.id === id && !st.isDeleted);
  },
  
  addProgram: async (program: CallProgram) => {
    const now = new Date().toISOString();
    const newProgram: CallProgram = {
      ...program,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };
    
    const state = get();
    const updated = [...state.programs, newProgram];
    await saveProgramCatalog({
      programs: updated,
      shiftTypes: state.shiftTypes,
    });
    set({ programs: updated });
  },
  
  updateProgram: async (id: string, updates: Partial<CallProgram>) => {
    const state = get();
    const updated = state.programs.map(p =>
      p.id === id
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    );
    await saveProgramCatalog({
      programs: updated,
      shiftTypes: state.shiftTypes,
    });
    set({ programs: updated });
  },
  
  deleteProgram: (id: string) => {
    get().updateProgram(id, { isDeleted: true });
    // Clear active program if it was deleted
    const { activeProgramId, setActiveProgram } = useUserPreferencesStore.getState();
    if (activeProgramId === id) {
      setActiveProgram(null);
    }
  },
  
  getProgram: (id: string) => {
    return get().programs.find(p => p.id === id && !p.isDeleted);
  },
}));

