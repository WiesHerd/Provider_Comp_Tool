/**
 * Call Pay Scenarios Store
 * 
 * Zustand store for managing call pay scenarios
 */

import { create } from 'zustand';
import { CallScenario, ScenarioComparison } from '@/types/call-scenarios';
import { loadCallPayScenarios, saveCallPayScenarios, loadScenarios as loadProviderScenarios, saveScenarios as saveProviderScenarios } from '@/lib/utils/storageClient';
import { ProviderScenario } from '@/types';

interface CallPayScenariosState {
  scenarios: CallScenario[];
  activeScenarioId: string | null;
  
  // Actions
  loadScenarios: () => void;
  saveScenario: (scenario: CallScenario) => void;
  updateScenario: (id: string, updates: Partial<CallScenario>) => void;
  deleteScenario: (id: string) => void;
  setActiveScenario: (id: string | null) => void;
  getScenario: (id: string) => CallScenario | null;
  getComparisonData: () => ScenarioComparison[];
}

// Note: Storage is handled by storageClient

/**
 * Convert CallScenario to ProviderScenario for storage
 */
function callScenarioToProviderScenario(scenario: CallScenario): ProviderScenario {
  return {
    id: scenario.id,
    name: scenario.name,
    scenarioType: 'call-pay',
    specialty: scenario.program.specialty,
    fte: 1.0, // Placeholder
    annualWrvus: 0, // Placeholder
    tccComponents: [],
    createdAt: scenario.createdAt,
    updatedAt: scenario.updatedAt,
    callPayData: {
      context: scenario.context,
      tiers: scenario.uiTiers,
      impact: {
        totalAnnualCallSpend: scenario.budgetResult.totalAnnualCallBudget,
        averageCallPayPerProvider: scenario.budgetResult.avgCallPayPerProvider,
        callPayPer1FTE: scenario.budgetResult.callPayPerFTE,
      },
    },
    // Store engine data in a custom field (we'll need to extend ProviderScenario or use a different approach)
    // For now, we'll store it in localStorage separately
  };
}

// Storage functions are now in storageClient

export const useCallPayScenariosStore = create<CallPayScenariosState>()((set, get) => ({
  scenarios: [],
  activeScenarioId: null,
  
  loadScenarios: async () => {
    const scenarios = await loadCallPayScenarios();
    set({ scenarios });
  },
  
  saveScenario: async (scenario: CallScenario) => {
    const currentScenarios = await loadCallPayScenarios();
    const existingIndex = currentScenarios.findIndex(s => s.id === scenario.id);
    
    let scenarios: CallScenario[];
    if (existingIndex >= 0) {
      scenarios = [...currentScenarios];
      scenarios[existingIndex] = scenario;
    } else {
      scenarios = [...currentScenarios, scenario];
    }
    
    await saveCallPayScenarios(scenarios);
    
    // Also save to ProviderScenario format for compatibility
    const providerScenario = callScenarioToProviderScenario(scenario);
    const currentProviderScenarios = await loadProviderScenarios();
    const providerIndex = currentProviderScenarios.findIndex(s => s.id === providerScenario.id);
    
    let providerScenarios: ProviderScenario[];
    if (providerIndex >= 0) {
      providerScenarios = [...currentProviderScenarios];
      providerScenarios[providerIndex] = providerScenario;
    } else {
      providerScenarios = [...currentProviderScenarios, providerScenario];
    }
    
    await saveProviderScenarios(providerScenarios);
    
    set({ scenarios });
  },
  
  updateScenario: (id: string, updates: Partial<CallScenario>) => {
    const scenario = get().getScenario(id);
    if (!scenario) return;
    
    const updated: CallScenario = {
      ...scenario,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    get().saveScenario(updated);
  },
  
  deleteScenario: async (id: string) => {
    const currentScenarios = await loadCallPayScenarios();
    const scenarios = currentScenarios.filter(s => s.id !== id);
    await saveCallPayScenarios(scenarios);
    
    // Also delete from ProviderScenario storage
    const currentProviderScenarios = await loadProviderScenarios();
    const providerScenarios = currentProviderScenarios.filter(s => s.id !== id);
    await saveProviderScenarios(providerScenarios);
    
    set({ scenarios });
    
    // Clear active scenario if it was deleted
    if (get().activeScenarioId === id) {
      set({ activeScenarioId: null });
    }
  },
  
  setActiveScenario: (id: string | null) => {
    set({ activeScenarioId: id });
  },
  
  getScenario: (id: string) => {
    return get().scenarios.find(s => s.id === id) || null;
  },
  
  getComparisonData: (): ScenarioComparison[] => {
    return get().scenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      totalCallBudget: scenario.budgetResult.totalAnnualCallBudget,
      callPayPerFTE: scenario.budgetResult.callPayPerFTE,
      fairnessScore: scenario.burdenSummary?.fairnessScore ?? 0,
      fmvRiskLevel: scenario.fmvSummary?.riskLevel ?? 'N/A',
      effectiveRatePer24h: scenario.fmvSummary?.effectiveRatePer24h ?? scenario.budgetResult.effectivePer24h,
      updatedAt: scenario.updatedAt,
    }));
  },
}));

