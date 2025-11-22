import { ProviderScenario } from '@/types';

const STORAGE_KEY = 'provider_scenarios';

/**
 * Save a scenario to localStorage
 */
export function saveScenario(scenario: ProviderScenario): void {
  const scenarios = loadScenarios();
  const existingIndex = scenarios.findIndex(s => s.id === scenario.id);
  
  if (existingIndex >= 0) {
    scenarios[existingIndex] = scenario;
  } else {
    scenarios.push(scenario);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

/**
 * Load all scenarios from localStorage
 */
export function loadScenarios(): ProviderScenario[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as ProviderScenario[];
  } catch (error) {
    console.error('Error loading scenarios:', error);
    return [];
  }
}

/**
 * Delete a scenario by ID
 */
export function deleteScenario(id: string): void {
  const scenarios = loadScenarios();
  const filtered = scenarios.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Get a scenario by ID
 */
export function getScenario(id: string): ProviderScenario | null {
  const scenarios = loadScenarios();
  return scenarios.find(s => s.id === id) || null;
}

