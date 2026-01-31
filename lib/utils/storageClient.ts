/**
 * Centralized Storage Client
 * 
 * Provides a unified interface for persisting application data.
 * Automatically uses Firebase when user is authenticated, falls back to localStorage otherwise.
 * Handles errors gracefully and falls back to defaults when data is missing or corrupted.
 */

import { safeLocalStorage } from '@/hooks/use-debounced-local-storage';
import { logger } from './logger';
import { CallProgram, ShiftType } from '@/types/call-program';
import { ProviderScenario } from '@/types';
import { CallScenario } from '@/types/call-scenarios';
import { SavedCFModel } from '@/types/cf-models';
import { DEFAULT_CALL_PROGRAMS } from '@/data/call-programs';
import { DEFAULT_SHIFT_TYPES } from '@/data/shift-types';
import { ModelingMode } from '@/types/call-pay';
import { useAuthStore } from '@/lib/store/auth-store';
import * as firebaseStorage from '@/lib/firebase/firebaseStorageClient';

// Storage keys
const STORAGE_KEY_PROGRAMS = 'call-programs-catalog';
const STORAGE_KEY_SHIFT_TYPES = 'call-shift-types-catalog';
const STORAGE_KEY_SCENARIOS = 'provider_scenarios';
const STORAGE_KEY_CALL_PAY_SCENARIOS = 'call-pay-scenarios';
const STORAGE_KEY_USER_PREFS = 'complens-user-preferences';
const STORAGE_KEY_CF_MODELS = 'cf-models';

export interface ProgramCatalogState {
  programs: CallProgram[];
  shiftTypes: ShiftType[];
}

export interface UserPreferences {
  activeProgramId: string | null;
  modelingMode: ModelingMode;
}

/**
 * Load program catalog (programs and shift types) from storage (Firebase only - requires auth)
 */
export async function loadProgramCatalog(): Promise<ProgramCatalogState>;
export function loadProgramCatalog(): ProgramCatalogState;
export function loadProgramCatalog(): ProgramCatalogState | Promise<ProgramCatalogState> {
  if (typeof window === 'undefined') {
    return {
      programs: DEFAULT_CALL_PROGRAMS,
      shiftTypes: DEFAULT_SHIFT_TYPES,
    };
  }

  const userId = useAuthStore.getState().user?.uid;
  
  // REQUIRE authentication - use Firebase
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.loadProgramCatalogFromFirebase(userId).then((result) => {
      // Merge with defaults if empty
      return {
        programs: result.programs.length > 0 ? result.programs : DEFAULT_CALL_PROGRAMS,
        shiftTypes: result.shiftTypes.length > 0 ? result.shiftTypes : DEFAULT_SHIFT_TYPES,
      };
    }).catch((error) => {
      logger.error('Error loading program catalog from Firebase:', error);
      // Return defaults on error (user is authenticated but Firebase failed)
      return {
        programs: DEFAULT_CALL_PROGRAMS,
        shiftTypes: DEFAULT_SHIFT_TYPES,
      };
    });
  }

  // If not authenticated, return defaults (user will be redirected to login)
  return {
    programs: DEFAULT_CALL_PROGRAMS,
    shiftTypes: DEFAULT_SHIFT_TYPES,
  };
}

/**
 * Save program catalog (programs and shift types) to storage (Firebase only - requires auth)
 */
export async function saveProgramCatalog(state: ProgramCatalogState): Promise<void>;
export function saveProgramCatalog(state: ProgramCatalogState): void;
export function saveProgramCatalog(state: ProgramCatalogState): void | Promise<void> {
  if (typeof window === 'undefined') return;

  const userId = useAuthStore.getState().user?.uid;
  
  // Warn if trying to save without authentication (but allow localStorage fallback)
  if (!userId && firebaseStorage.shouldUseFirebase()) {
    logger.warn('Attempting to save program catalog without authentication. Data will only be saved to localStorage.');
  }
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.saveProgramCatalogToFirebase(userId, state.programs, state.shiftTypes)
      .then(() => {
        // Also save to localStorage as backup
        try {
          const programsSerialized = JSON.stringify(state.programs);
          const shiftTypesSerialized = JSON.stringify(state.shiftTypes);
          safeLocalStorage.setItem(STORAGE_KEY_PROGRAMS, programsSerialized);
          safeLocalStorage.setItem(STORAGE_KEY_SHIFT_TYPES, shiftTypesSerialized);
        } catch (error) {
          logger.error('Error saving program catalog backup to localStorage:', error);
        }
      })
      .catch((error) => {
        logger.error('Error saving program catalog to Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
        try {
          const programsSerialized = JSON.stringify(state.programs);
          const shiftTypesSerialized = JSON.stringify(state.shiftTypes);
          safeLocalStorage.setItem(STORAGE_KEY_PROGRAMS, programsSerialized);
          safeLocalStorage.setItem(STORAGE_KEY_SHIFT_TYPES, shiftTypesSerialized);
        } catch (e) {
          logger.error('Error saving program catalog to localStorage:', e);
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    const programsSerialized = JSON.stringify(state.programs);
    const shiftTypesSerialized = JSON.stringify(state.shiftTypes);
    safeLocalStorage.setItem(STORAGE_KEY_PROGRAMS, programsSerialized);
    safeLocalStorage.setItem(STORAGE_KEY_SHIFT_TYPES, shiftTypesSerialized);
  } catch (error) {
    logger.error('Error saving program catalog to storage:', error);
  }
}


/**
 * Load scenarios from storage (Firebase or localStorage)
 */
export async function loadScenarios(): Promise<ProviderScenario[]>;
export function loadScenarios(): ProviderScenario[];
export function loadScenarios(): ProviderScenario[] | Promise<ProviderScenario[]> {
  if (typeof window === 'undefined') return [];

  const userId = useAuthStore.getState().user?.uid;
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.loadScenariosFromFirebase(userId);
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
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
 * Save scenarios to storage (Firebase or localStorage)
 */
export async function saveScenarios(scenarios: ProviderScenario[]): Promise<void>;
export function saveScenarios(scenarios: ProviderScenario[]): void;
export function saveScenarios(scenarios: ProviderScenario[]): void | Promise<void> {
  if (typeof window === 'undefined') return;

  const userId = useAuthStore.getState().user?.uid;
  
  // Warn if trying to save without authentication (but allow localStorage fallback)
  if (!userId && firebaseStorage.shouldUseFirebase()) {
    logger.warn('Attempting to save scenarios without authentication. Data will only be saved to localStorage.');
  }
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return Promise.all(
      scenarios.map(scenario => firebaseStorage.saveScenarioToFirebase(userId, scenario))
    ).then(() => {
      // Convert Promise<void[]> to Promise<void>
    }).catch((error) => {
      logger.error('Error saving scenarios to Firebase, falling back to localStorage:', error);
      // Fallback to localStorage on error
      try {
        const serialized = JSON.stringify(scenarios);
        safeLocalStorage.setItem(STORAGE_KEY_SCENARIOS, serialized);
      } catch (e) {
        logger.error('Error saving scenarios to localStorage:', e);
      }
    });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    const serialized = JSON.stringify(scenarios);
    if (!safeLocalStorage.setItem(STORAGE_KEY_SCENARIOS, serialized)) {
      logger.error('Failed to save scenarios to storage');
    }
  } catch (error) {
    logger.error('Error saving scenarios to storage:', error);
  }
}

/**
 * Load call pay scenarios from storage (Firebase or localStorage)
 */
export async function loadCallPayScenarios(): Promise<CallScenario[]>;
export function loadCallPayScenarios(): CallScenario[];
export function loadCallPayScenarios(): CallScenario[] | Promise<CallScenario[]> {
  if (typeof window === 'undefined') return [];

  const userId = useAuthStore.getState().user?.uid;
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.loadCallPayScenariosFromFirebase(userId);
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
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
 * Save call pay scenarios to storage (Firebase or localStorage)
 */
export async function saveCallPayScenarios(scenarios: CallScenario[]): Promise<void>;
export function saveCallPayScenarios(scenarios: CallScenario[]): void;
export function saveCallPayScenarios(scenarios: CallScenario[]): void | Promise<void> {
  if (typeof window === 'undefined') return;

  const userId = useAuthStore.getState().user?.uid;
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return Promise.all(
      scenarios.map(scenario => firebaseStorage.saveCallPayScenarioToFirebase(userId, scenario))
    ).then(() => {
      // Convert Promise<void[]> to Promise<void>
    }).catch((error) => {
      logger.error('Error saving call pay scenarios to Firebase, falling back to localStorage:', error);
      // Fallback to localStorage on error
      try {
        const serialized = JSON.stringify(scenarios);
        safeLocalStorage.setItem(STORAGE_KEY_CALL_PAY_SCENARIOS, serialized);
      } catch (e) {
        logger.error('Error saving call pay scenarios to localStorage:', e);
      }
    });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    const serialized = JSON.stringify(scenarios);
    if (!safeLocalStorage.setItem(STORAGE_KEY_CALL_PAY_SCENARIOS, serialized)) {
      logger.error('Failed to save call pay scenarios to storage');
    }
  } catch (error) {
    logger.error('Error saving call pay scenarios to storage:', error);
  }
}

/**
 * Load user preferences from storage (Firebase or localStorage)
 */
export async function loadUserPrefs(): Promise<UserPreferences>;
export function loadUserPrefs(): UserPreferences;
export function loadUserPrefs(): UserPreferences | Promise<UserPreferences> {
  if (typeof window === 'undefined') {
    return {
      activeProgramId: null,
      modelingMode: 'quick',
    };
  }

  const userId = useAuthStore.getState().user?.uid;
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.loadUserPreferencesFromFirebase(userId)
      .then((prefs) => {
        // Also update localStorage as backup
        try {
          const serialized = JSON.stringify(prefs);
          safeLocalStorage.setItem(STORAGE_KEY_USER_PREFS, serialized);
        } catch (error) {
          logger.error('Error updating localStorage backup:', error);
        }
        return prefs;
      })
      .catch((error) => {
        logger.error('Error loading user preferences from Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
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
        } catch (e) {
          logger.error('Error loading user preferences from localStorage:', e);
          return {
            activeProgramId: null,
            modelingMode: 'quick',
          };
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
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
 * Save user preferences to storage (Firebase or localStorage)
 */
export async function saveUserPrefs(prefs: UserPreferences): Promise<void>;
export function saveUserPrefs(prefs: UserPreferences): void;
export function saveUserPrefs(prefs: UserPreferences): void | Promise<void> {
  if (typeof window === 'undefined') return;

  const userId = useAuthStore.getState().user?.uid;
  
  // Warn if trying to save without authentication (but allow localStorage fallback)
  if (!userId && firebaseStorage.shouldUseFirebase()) {
    logger.warn('Attempting to save user preferences without authentication. Data will only be saved to localStorage.');
  }
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.saveUserPreferencesToFirebase(userId, prefs)
      .then(() => {
        // Also save to localStorage as backup
        try {
          const serialized = JSON.stringify(prefs);
          safeLocalStorage.setItem(STORAGE_KEY_USER_PREFS, serialized);
        } catch (error) {
          logger.error('Error saving user preferences backup to localStorage:', error);
        }
      })
      .catch((error) => {
        logger.error('Error saving user preferences to Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
        try {
          const serialized = JSON.stringify(prefs);
          if (!safeLocalStorage.setItem(STORAGE_KEY_USER_PREFS, serialized)) {
            logger.error('Failed to save user preferences to localStorage');
          }
        } catch (e) {
          logger.error('Error saving user preferences to localStorage:', e);
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
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

/**
 * Load CF models from storage (Firebase or localStorage)
 */
export async function loadCFModels(): Promise<SavedCFModel[]>;
export function loadCFModels(): SavedCFModel[];
export function loadCFModels(): SavedCFModel[] | Promise<SavedCFModel[]> {
  if (typeof window === 'undefined') return [];

  const userId = useAuthStore.getState().user?.uid;
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.loadCFModelsFromFirebase(userId)
      .then((models) => {
        // Also update localStorage as backup
        try {
          const serialized = JSON.stringify(models);
          safeLocalStorage.setItem(STORAGE_KEY_CF_MODELS, serialized);
        } catch (error) {
          logger.error('Error updating localStorage backup:', error);
        }
        return models;
      })
      .catch((error) => {
        logger.error('Error loading CF models from Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
        try {
          const stored = safeLocalStorage.getItem(STORAGE_KEY_CF_MODELS);
          if (!stored) return [];
          const parsed = JSON.parse(stored);
          if (!Array.isArray(parsed)) return [];
          // Validate models have required fields
          return parsed.filter((m: unknown): m is SavedCFModel => {
            if (typeof m !== 'object' || m === null) return false;
            const model = m as Record<string, unknown>;
            return (
              typeof model.id === 'string' &&
              typeof model.name === 'string' &&
              typeof model.model === 'object' &&
              model.model !== null
            );
          });
        } catch (e) {
          logger.error('Error loading CF models from localStorage:', e);
          return [];
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    const stored = safeLocalStorage.getItem(STORAGE_KEY_CF_MODELS);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    // Validate models have required fields
    return parsed.filter((m: unknown): m is SavedCFModel => {
      if (typeof m !== 'object' || m === null) return false;
      const model = m as Record<string, unknown>;
      return (
        typeof model.id === 'string' &&
        typeof model.name === 'string' &&
        typeof model.model === 'object' &&
        model.model !== null
      );
    });
  } catch (error) {
    logger.error('Error loading CF models from storage:', error);
    return [];
  }
}

/**
 * Save CF models to storage (Firebase or localStorage)
 */
export async function saveCFModels(models: SavedCFModel[]): Promise<void>;
export function saveCFModels(models: SavedCFModel[]): void;
export function saveCFModels(models: SavedCFModel[]): void | Promise<void> {
  if (typeof window === 'undefined') return;

  const userId = useAuthStore.getState().user?.uid;
  
  // Warn if trying to save without authentication (but allow localStorage fallback)
  if (!userId && firebaseStorage.shouldUseFirebase()) {
    logger.warn('Attempting to save CF models without authentication. Data will only be saved to localStorage.');
  }
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return Promise.all(
      models.map(model => firebaseStorage.saveCFModelToFirebase(userId, model))
    ).then(() => {
      // Also save to localStorage as backup
      try {
        const serialized = JSON.stringify(models);
        safeLocalStorage.setItem(STORAGE_KEY_CF_MODELS, serialized);
      } catch (error) {
        logger.error('Error saving CF models backup to localStorage:', error);
      }
    }).catch((error) => {
      logger.error('Error saving CF models to Firebase, falling back to localStorage:', error);
      // Fallback to localStorage on error
      try {
        const serialized = JSON.stringify(models);
        if (!safeLocalStorage.setItem(STORAGE_KEY_CF_MODELS, serialized)) {
          logger.error('Failed to save CF models to localStorage');
        }
      } catch (e) {
        logger.error('Error saving CF models to localStorage:', e);
      }
    });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    const serialized = JSON.stringify(models);
    if (!safeLocalStorage.setItem(STORAGE_KEY_CF_MODELS, serialized)) {
      logger.error('Failed to save CF models to storage');
    }
  } catch (error) {
    logger.error('Error saving CF models to storage:', error);
    // Don't throw - allow app to continue even if storage fails
  }
}


