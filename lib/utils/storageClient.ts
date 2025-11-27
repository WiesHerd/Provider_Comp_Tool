/**
 * Centralized Storage Client
 * 
 * Provides a unified interface for persisting application data to browser storage.
 * Handles errors gracefully and falls back to defaults when data is missing or corrupted.
 */

import { safeLocalStorage } from '@/hooks/use-debounced-local-storage';
import { logger } from './logger';
import { CallProgram, ShiftType } from '@/types/call-program';
import { ProviderScenario } from '@/types';
import { CallScenario } from '@/types/call-scenarios';
import { DEFAULT_CALL_PROGRAMS } from '@/data/call-programs';
import { DEFAULT_SHIFT_TYPES } from '@/data/shift-types';
import { ModelingMode } from '@/types/call-pay';

// Storage keys
const STORAGE_KEY_PROGRAMS = 'call-programs-catalog';
const STORAGE_KEY_SHIFT_TYPES = 'call-shift-types-catalog';
const STORAGE_KEY_SCENARIOS = 'provider_scenarios';
const STORAGE_KEY_CALL_PAY_SCENARIOS = 'call-pay-scenarios';
const STORAGE_KEY_USER_PREFS = 'complens-user-preferences';

export interface ProgramCatalogState {
  programs: CallProgram[];
  shiftTypes: ShiftType[];
}

export interface UserPreferences {
  activeProgramId: string | null;
  modelingMode: ModelingMode;
}

/**
 * Load program catalog (programs and shift types) from storage
 */
export function loadProgramCatalog(): ProgramCatalogState {
  if (typeof window === 'undefined') {
    return {
      programs: DEFAULT_CALL_PROGRAMS,
      shiftTypes: DEFAULT_SHIFT_TYPES,
    };
  }

  try {
    const programsStored = safeLocalStorage.getItem(STORAGE_KEY_PROGRAMS);
    const shiftTypesStored = safeLocalStorage.getItem(STORAGE_KEY_SHIFT_TYPES);

    const programs: CallProgram[] = programsStored
      ? (() => {
          try {
            const parsed = JSON.parse(programsStored);
            return Array.isArray(parsed) ? parsed : DEFAULT_CALL_PROGRAMS;
          } catch {
            logger.error('Error parsing programs from storage, using defaults');
            return DEFAULT_CALL_PROGRAMS;
          }
        })()
      : DEFAULT_CALL_PROGRAMS;

    const shiftTypes: ShiftType[] = shiftTypesStored
      ? (() => {
          try {
            const parsed = JSON.parse(shiftTypesStored);
            return Array.isArray(parsed) ? parsed : DEFAULT_SHIFT_TYPES;
          } catch {
            logger.error('Error parsing shift types from storage, using defaults');
            return DEFAULT_SHIFT_TYPES;
          }
        })()
      : DEFAULT_SHIFT_TYPES;

    return { programs, shiftTypes };
  } catch (error) {
    logger.error('Error loading program catalog from storage:', error);
    return {
      programs: DEFAULT_CALL_PROGRAMS,
      shiftTypes: DEFAULT_SHIFT_TYPES,
    };
  }
}

/**
 * Save program catalog (programs and shift types) to storage
 */
export function saveProgramCatalog(state: ProgramCatalogState): void {
  if (typeof window === 'undefined') return;

  try {
    const programsSerialized = JSON.stringify(state.programs);
    const shiftTypesSerialized = JSON.stringify(state.shiftTypes);

    if (!safeLocalStorage.setItem(STORAGE_KEY_PROGRAMS, programsSerialized)) {
      logger.error('Failed to save programs to storage');
    }

    if (!safeLocalStorage.setItem(STORAGE_KEY_SHIFT_TYPES, shiftTypesSerialized)) {
      logger.error('Failed to save shift types to storage');
    }
  } catch (error) {
    logger.error('Error saving program catalog to storage:', error);
    // Don't throw - allow app to continue even if storage fails
  }
}

/**
 * Load scenarios from storage
 */
export function loadScenarios(): ProviderScenario[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = safeLocalStorage.getItem(STORAGE_KEY_SCENARIOS);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.error('Error loading scenarios from storage:', error);
    return [];
  }
}

/**
 * Save scenarios to storage
 */
export function saveScenarios(scenarios: ProviderScenario[]): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(scenarios);
    if (!safeLocalStorage.setItem(STORAGE_KEY_SCENARIOS, serialized)) {
      logger.error('Failed to save scenarios to storage');
    }
  } catch (error) {
    logger.error('Error saving scenarios to storage:', error);
    // Don't throw - allow app to continue even if storage fails
  }
}

/**
 * Load call pay scenarios from storage
 */
export function loadCallPayScenarios(): CallScenario[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = safeLocalStorage.getItem(STORAGE_KEY_CALL_PAY_SCENARIOS);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    // Validate scenarios have required fields
    return parsed.filter((s: unknown): s is CallScenario => {
      if (typeof s !== 'object' || s === null) return false;
      const scenario = s as Record<string, unknown>;
      return typeof scenario.id === 'string' && typeof scenario.name === 'string';
    });
  } catch (error) {
    logger.error('Error loading call pay scenarios from storage:', error);
    return [];
  }
}

/**
 * Save call pay scenarios to storage
 */
export function saveCallPayScenarios(scenarios: CallScenario[]): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(scenarios);
    if (!safeLocalStorage.setItem(STORAGE_KEY_CALL_PAY_SCENARIOS, serialized)) {
      logger.error('Failed to save call pay scenarios to storage');
    }
  } catch (error) {
    logger.error('Error saving call pay scenarios to storage:', error);
    // Don't throw - allow app to continue even if storage fails
  }
}

/**
 * Load user preferences from storage
 */
export function loadUserPrefs(): UserPreferences {
  if (typeof window === 'undefined') {
    return {
      activeProgramId: null,
      modelingMode: 'quick',
    };
  }

  try {
    const stored = safeLocalStorage.getItem(STORAGE_KEY_USER_PREFS);
    if (!stored) {
      return {
        activeProgramId: null,
        modelingMode: 'quick',
      };
    }

    const parsed = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        activeProgramId: null,
        modelingMode: 'quick',
      };
    }

    return {
      activeProgramId: typeof parsed.activeProgramId === 'string' ? parsed.activeProgramId : null,
      modelingMode: parsed.modelingMode === 'quick' || parsed.modelingMode === 'advanced' 
        ? parsed.modelingMode 
        : 'quick',
    };
  } catch (error) {
    logger.error('Error loading user preferences from storage:', error);
    return {
      activeProgramId: null,
      modelingMode: 'quick',
    };
  }
}

/**
 * Save user preferences to storage
 */
export function saveUserPrefs(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    const serialized = JSON.stringify(prefs);
    if (!safeLocalStorage.setItem(STORAGE_KEY_USER_PREFS, serialized)) {
      logger.error('Failed to save user preferences to storage');
    }
  } catch (error) {
    logger.error('Error saving user preferences to storage:', error);
    // Don't throw - allow app to continue even if storage fails
  }
}

