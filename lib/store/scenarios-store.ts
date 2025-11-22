import { create } from 'zustand';
import { ProviderScenario } from '@/types';
import { saveScenario, loadScenarios, deleteScenario as deleteScenarioStorage } from '@/lib/utils/storage';

interface ScenariosState {
  scenarios: ProviderScenario[];
  loadScenarios: () => void;
  saveScenario: (scenario: ProviderScenario) => void;
  updateScenario: (id: string, updates: Partial<ProviderScenario>) => void;
  deleteScenario: (id: string) => void;
  duplicateScenario: (id: string) => void;
  getScenario: (id: string) => ProviderScenario | null;
}

export const useScenariosStore = create<ScenariosState>()((set, get) => ({
  scenarios: [],
  
  loadScenarios: () => {
    const scenarios = loadScenarios();
    set({ scenarios });
  },
  
  saveScenario: (scenario: ProviderScenario) => {
    saveScenario(scenario);
    const scenarios = loadScenarios();
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
  
  deleteScenario: (id: string) => {
    deleteScenarioStorage(id);
    const scenarios = loadScenarios();
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
    };
    
    get().saveScenario(duplicated);
  },
  
  getScenario: (id: string) => {
    return get().scenarios.find(s => s.id === id) || null;
  },
}));

