/**
 * Migration Utility
 * 
 * Migrates localStorage data to Firebase Firestore
 * Should be called after user logs in for the first time
 */

'use client';

import { logger } from '@/lib/utils/logger';
import { safeLocalStorage } from '@/hooks/use-debounced-local-storage';
import * as firebaseStorage from './firebaseStorageClient';
import type { ProviderScenario } from '@/types';
import type { CallScenario } from '@/types/call-scenarios';
import type { SavedCFModel } from '@/types/cf-models';
import type { CallProgram, ShiftType } from '@/types/call-program';

// Storage keys
const STORAGE_KEY_SCENARIOS = 'provider_scenarios';
const STORAGE_KEY_CALL_PAY_SCENARIOS = 'call-pay-scenarios';
const STORAGE_KEY_CF_MODELS = 'cf-models';
const STORAGE_KEY_PROGRAMS = 'call-programs-catalog';
const STORAGE_KEY_SHIFT_TYPES = 'call-shift-types-catalog';
const MIGRATION_FLAG = 'complens-migrated-to-firebase';

interface MigrationResult {
  success: boolean;
  scenariosMigrated: number;
  callPayScenariosMigrated: number;
  cfModelsMigrated: number;
  programsMigrated: number;
  shiftTypesMigrated: number;
  errors: string[];
}

/**
 * Check if migration has already been completed
 */
export function hasMigrated(): boolean {
  if (typeof window === 'undefined') return false;
  return safeLocalStorage.getItem(MIGRATION_FLAG) === 'true';
}

/**
 * Mark migration as complete
 */
function markMigrated(): void {
  if (typeof window === 'undefined') return;
  safeLocalStorage.setItem(MIGRATION_FLAG, 'true');
}

/**
 * Migrate all localStorage data to Firebase
 */
export async function migrateToFirebase(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    scenariosMigrated: 0,
    callPayScenariosMigrated: 0,
    cfModelsMigrated: 0,
    programsMigrated: 0,
    shiftTypesMigrated: 0,
    errors: [],
  };

  if (!firebaseStorage.shouldUseFirebase()) {
    result.errors.push('Firebase is not configured or user is not authenticated');
    return result;
  }

  try {
    // Migrate scenarios
    try {
      const scenariosJson = safeLocalStorage.getItem(STORAGE_KEY_SCENARIOS);
      if (scenariosJson) {
        const scenarios: ProviderScenario[] = JSON.parse(scenariosJson);
        if (Array.isArray(scenarios) && scenarios.length > 0) {
          for (const scenario of scenarios) {
            try {
              await firebaseStorage.saveScenarioToFirebase(userId, scenario);
              result.scenariosMigrated++;
            } catch (error) {
              result.errors.push(`Failed to migrate scenario ${scenario.id}: ${error}`);
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`Error migrating scenarios: ${error}`);
    }

    // Migrate call pay scenarios
    try {
      const callPayScenariosJson = safeLocalStorage.getItem(STORAGE_KEY_CALL_PAY_SCENARIOS);
      if (callPayScenariosJson) {
        const scenarios: CallScenario[] = JSON.parse(callPayScenariosJson);
        if (Array.isArray(scenarios) && scenarios.length > 0) {
          for (const scenario of scenarios) {
            try {
              await firebaseStorage.saveCallPayScenarioToFirebase(userId, scenario);
              result.callPayScenariosMigrated++;
            } catch (error) {
              result.errors.push(`Failed to migrate call pay scenario ${scenario.id}: ${error}`);
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`Error migrating call pay scenarios: ${error}`);
    }

    // Migrate CF models
    try {
      const cfModelsJson = safeLocalStorage.getItem(STORAGE_KEY_CF_MODELS);
      if (cfModelsJson) {
        const models: SavedCFModel[] = JSON.parse(cfModelsJson);
        if (Array.isArray(models) && models.length > 0) {
          for (const model of models) {
            try {
              await firebaseStorage.saveCFModelToFirebase(userId, model);
              result.cfModelsMigrated++;
            } catch (error) {
              result.errors.push(`Failed to migrate CF model ${model.id}: ${error}`);
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`Error migrating CF models: ${error}`);
    }

    // Migrate program catalog
    try {
      const programsJson = safeLocalStorage.getItem(STORAGE_KEY_PROGRAMS);
      const shiftTypesJson = safeLocalStorage.getItem(STORAGE_KEY_SHIFT_TYPES);
      
      const programs: CallProgram[] = programsJson ? JSON.parse(programsJson) : [];
      const shiftTypes: ShiftType[] = shiftTypesJson ? JSON.parse(shiftTypesJson) : [];

      if (programs.length > 0 || shiftTypes.length > 0) {
        await firebaseStorage.saveProgramCatalogToFirebase(userId, programs, shiftTypes);
        result.programsMigrated = programs.length;
        result.shiftTypesMigrated = shiftTypes.length;
      }
    } catch (error) {
      result.errors.push(`Error migrating program catalog: ${error}`);
    }

    // Mark migration as complete if no critical errors
    if (result.errors.length === 0 || result.scenariosMigrated > 0) {
      markMigrated();
      result.success = true;
      logger.log('Migration completed successfully', result);
    } else {
      logger.warn('Migration completed with errors', result);
    }
  } catch (error) {
    result.errors.push(`Migration failed: ${error}`);
    logger.error('Migration error:', error);
  }

  return result;
}

/**
 * Clear localStorage after successful migration (optional)
 */
export function clearLocalStorageAfterMigration(): void {
  if (typeof window === 'undefined') return;
  
  try {
    safeLocalStorage.removeItem(STORAGE_KEY_SCENARIOS);
    safeLocalStorage.removeItem(STORAGE_KEY_CALL_PAY_SCENARIOS);
    safeLocalStorage.removeItem(STORAGE_KEY_CF_MODELS);
    safeLocalStorage.removeItem(STORAGE_KEY_PROGRAMS);
    safeLocalStorage.removeItem(STORAGE_KEY_SHIFT_TYPES);
    // Keep user prefs in localStorage for now (they're small)
    logger.log('LocalStorage cleared after migration');
  } catch (error) {
    logger.error('Error clearing localStorage:', error);
  }
}




