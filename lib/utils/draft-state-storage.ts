/**
 * Unified Draft State Storage
 * 
 * Provides a unified interface for saving and loading draft states across all screens.
 * Automatically uses Firebase when user is authenticated, falls back to localStorage otherwise.
 */

import { safeLocalStorage } from '@/hooks/use-debounced-local-storage';
import { logger } from './logger';
import { useAuthStore } from '@/lib/store/auth-store';
import * as firebaseStorage from '@/lib/firebase/firebaseStorageClient';

/**
 * Screen IDs for draft state storage
 */
export const DRAFT_SCREEN_IDS = {
  CALL_PAY_MODELER: 'callPayModeler',
  WRVU_FORECASTER: 'wrvuForecaster',
  WRVU_MODELER: 'wrvuModeler',
  FMV_TCC: 'fmvTcc',
  FMV_WRVU: 'fmvWrvu',
  FMV_CF: 'fmvCf',
  INTERNAL_BENCHMARK: 'internalBenchmark',
} as const;

export type DraftScreenId = typeof DRAFT_SCREEN_IDS[keyof typeof DRAFT_SCREEN_IDS];

/**
 * Load draft state for a screen (Firebase or localStorage)
 */
export async function loadDraftState<T extends Record<string, unknown>>(
  screenId: DraftScreenId,
  localStorageKey: string
): Promise<T | null>;
export function loadDraftState<T extends Record<string, unknown>>(
  screenId: DraftScreenId,
  localStorageKey: string
): T | null | Promise<T | null> {
  if (typeof window === 'undefined') return null;

  const userId = useAuthStore.getState().user?.uid;
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.loadDraftStateFromFirebase(userId, screenId)
      .then((firebaseData) => {
        if (firebaseData) {
          // Also update localStorage as backup
          try {
            const serialized = JSON.stringify(firebaseData);
            safeLocalStorage.setItem(localStorageKey, serialized);
          } catch (error) {
            logger.error('Error updating localStorage backup:', error);
          }
          return firebaseData as T;
        }
        // If no Firebase data, try localStorage
        try {
          const stored = safeLocalStorage.getItem(localStorageKey);
          if (!stored) return null;
          return JSON.parse(stored) as T;
        } catch (error) {
          logger.error('Error loading draft state from localStorage:', error);
          return null;
        }
      })
      .catch((error) => {
        logger.error('Error loading draft state from Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
        try {
          const stored = safeLocalStorage.getItem(localStorageKey);
          if (!stored) return null;
          return JSON.parse(stored) as T;
        } catch (e) {
          logger.error('Error loading draft state from localStorage:', e);
          return null;
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    const stored = safeLocalStorage.getItem(localStorageKey);
    if (!stored) return null;
    return JSON.parse(stored) as T;
  } catch (error) {
    logger.error('Error loading draft state from storage:', error);
    return null;
  }
}

/**
 * Save draft state for a screen (Firebase or localStorage)
 */
export async function saveDraftState<T extends Record<string, unknown>>(
  screenId: DraftScreenId,
  localStorageKey: string,
  draftData: T
): Promise<void>;
export function saveDraftState<T extends Record<string, unknown>>(
  screenId: DraftScreenId,
  localStorageKey: string,
  draftData: T
): void | Promise<void> {
  if (typeof window === 'undefined') return;

  const userId = useAuthStore.getState().user?.uid;
  
  // Warn if trying to save without authentication (but allow localStorage fallback)
  if (!userId && firebaseStorage.shouldUseFirebase()) {
    logger.warn(`Attempting to save draft state for ${screenId} without authentication. Data will only be saved to localStorage.`);
  }
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.saveDraftStateToFirebase(userId, screenId, draftData)
      .then(() => {
        // Also save to localStorage as backup
        try {
          const serialized = JSON.stringify(draftData);
          safeLocalStorage.setItem(localStorageKey, serialized);
        } catch (error) {
          logger.error('Error saving draft state backup to localStorage:', error);
        }
      })
      .catch((error) => {
        logger.error('Error saving draft state to Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
        try {
          const serialized = JSON.stringify(draftData);
          if (!safeLocalStorage.setItem(localStorageKey, serialized)) {
            logger.error('Failed to save draft state to localStorage');
          }
        } catch (e) {
          logger.error('Error saving draft state to localStorage:', e);
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    const serialized = JSON.stringify(draftData);
    if (!safeLocalStorage.setItem(localStorageKey, serialized)) {
      logger.error('Failed to save draft state to storage');
    }
  } catch (error) {
    logger.error('Error saving draft state to storage:', error);
  }
}

/**
 * Delete draft state for a screen (Firebase or localStorage)
 */
export async function deleteDraftState(
  screenId: DraftScreenId,
  localStorageKey: string
): Promise<void>;
export function deleteDraftState(
  screenId: DraftScreenId,
  localStorageKey: string
): void | Promise<void> {
  if (typeof window === 'undefined') return;

  const userId = useAuthStore.getState().user?.uid;
  
  // Use Firebase if configured and user is authenticated
  if (userId && firebaseStorage.shouldUseFirebase()) {
    return firebaseStorage.deleteDraftStateFromFirebase(userId, screenId)
      .then(() => {
        // Also delete from localStorage
        try {
          localStorage.removeItem(localStorageKey);
        } catch (error) {
          logger.error('Error deleting draft state from localStorage:', error);
        }
      })
      .catch((error) => {
        logger.error('Error deleting draft state from Firebase, falling back to localStorage:', error);
        // Fallback to localStorage on error
        try {
          localStorage.removeItem(localStorageKey);
        } catch (e) {
          logger.error('Error deleting draft state from localStorage:', e);
        }
      });
  }

  // Fallback to localStorage if Firebase not configured or user not authenticated
  try {
    localStorage.removeItem(localStorageKey);
  } catch (error) {
    logger.error('Error deleting draft state from storage:', error);
  }
}




