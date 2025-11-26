import { ProviderScenario } from '@/types';
import { safeLocalStorage } from '@/hooks/use-debounced-local-storage';
import { logger } from './logger';

const STORAGE_KEY = 'provider_scenarios';

/**
 * Save a scenario to localStorage
 */
export function saveScenario(scenario: ProviderScenario): void {
  try {
    const scenarios = loadScenarios();
    const existingIndex = scenarios.findIndex(s => s.id === scenario.id);
    
    if (existingIndex >= 0) {
      scenarios[existingIndex] = scenario;
    } else {
      scenarios.push(scenario);
    }
    
    const serialized = JSON.stringify(scenarios);
    if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
      logger.error('Failed to save scenario to localStorage');
    }
  } catch (error) {
    logger.error('Error saving scenario:', error);
    throw new Error('Failed to save scenario. Please try again.');
  }
}

/**
 * Load all scenarios from localStorage
 */
export function loadScenarios(): ProviderScenario[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = safeLocalStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as ProviderScenario[];
  } catch (error) {
    logger.error('Error loading scenarios:', error);
    return [];
  }
}

/**
 * Delete a scenario by ID
 */
export function deleteScenario(id: string): void {
  try {
    const scenarios = loadScenarios();
    const filtered = scenarios.filter(s => s.id !== id);
    const serialized = JSON.stringify(filtered);
    if (!safeLocalStorage.setItem(STORAGE_KEY, serialized)) {
      logger.error('Failed to delete scenario from localStorage');
    }
  } catch (error) {
    logger.error('Error deleting scenario:', error);
    throw new Error('Failed to delete scenario. Please try again.');
  }
}

/**
 * Get a scenario by ID
 */
export function getScenario(id: string): ProviderScenario | null {
  const scenarios = loadScenarios();
  return scenarios.find(s => s.id === id) || null;
}









