import { create } from 'zustand';
import { ProviderScenario } from '@/types';
import { loadScenarios as loadScenariosFromStorage, saveScenarios } from '@/lib/utils/storageClient';

interface ScenariosState {
  scenarios: ProviderScenario[];
  loadScenarios: () => void;
  saveScenario: (scenario: ProviderScenario) => void;
  updateScenario: (id: string, updates: Partial<ProviderScenario>) => void;
  deleteScenario: (id: string) => void;
  duplicateScenario: (id: string) => void;
  dismissFromRecent: (id: string) => void;
  restoreToRecent: (id: string) => void;
  getScenario: (id: string) => ProviderScenario | null;
}

export const useScenariosStore = create<ScenariosState>()((set, get) => ({
  scenarios: [],
  
  loadScenarios: async () => {
    const scenarios = await loadScenariosFromStorage();
    set({ scenarios });
  },
  
  saveScenario: async (scenario: ProviderScenario) => {
    const currentScenarios = await loadScenariosFromStorage();
    const existingIndex = currentScenarios.findIndex(s => s.id === scenario.id);
    
    let scenarios: ProviderScenario[];
    if (existingIndex >= 0) {
      scenarios = [...currentScenarios];
      scenarios[existingIndex] = scenario;
    } else {
      scenarios = [...currentScenarios, scenario];
    }
    
    await saveScenarios(scenarios);
    set({ scenarios });
  },
  
  updateScenario: (id: string, updates: Partial<ProviderScenario>) => {
    const scenario = get().getScenario(id);
    if (!scenario) return;
    
    const updated = {
      ...scenario,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    get().saveScenario(updated);
  },
  
  deleteScenario: async (id: string) => {
    const currentScenarios = await loadScenariosFromStorage();
    const scenarios = currentScenarios.filter(s => s.id !== id);
    await saveScenarios(scenarios);
    set({ scenarios });
  },
  
  duplicateScenario: (id: string) => {
    const scenario = get().getScenario(id);
    if (!scenario) return;
    
    const duplicated: ProviderScenario = {
      ...scenario,
      id: `${scenario.id}-${Date.now()}`,
      name: `${scenario.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dismissedFromRecent: undefined, // New copies should appear in recent
    };
    
    get().saveScenario(duplicated);
  },
  
  dismissFromRecent: (id: string) => {
    const scenario = get().getScenario(id);
    if (!scenario) return;
    
    const updated = {
      ...scenario,
      dismissedFromRecent: true,
      updatedAt: new Date().toISOString(),
    };
    
    get().saveScenario(updated);
  },
  
  restoreToRecent: (id: string) => {
    const scenario = get().getScenario(id);
    if (!scenario) return;
    
    const updated = {
      ...scenario,
      dismissedFromRecent: false,
      updatedAt: new Date().toISOString(),
    };
    
    get().saveScenario(updated);
  },
  
  getScenario: (id: string) => {
    return get().scenarios.find(s => s.id === id) || null;
  },
}));

