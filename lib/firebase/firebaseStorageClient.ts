/**
 * Firebase Storage Client
 * 
 * Handles all Firestore operations for the app.
 * Uses free tier limits - optimized for light usage.
 */

'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { logger } from '@/lib/utils/logger';
import type { ProviderScenario } from '@/types';
import type { CallScenario } from '@/types/call-scenarios';
import type { SavedCFModel } from '@/types/cf-models';
import type { CallProgram, ShiftType } from '@/types/call-program';
import type { SavedMarketData } from '@/lib/utils/market-data-storage';
import type { ProviderWRVUTrackingState } from '@/types/provider-wrvu-tracking';

export interface FeedbackData {
  id: string;
  name?: string;
  email?: string;
  message: string;
  page?: string;
  createdAt: string;
}

/**
 * Check if Firebase is configured and available
 */
export function shouldUseFirebase(): boolean {
  return db !== null;
}

/**
 * Convert Firestore timestamp to ISO string
 */
function convertTimestamp(timestamp: unknown): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return new Date().toISOString();
}

/**
 * Convert Firestore document to ProviderScenario
 */
function docToScenario(docData: any): ProviderScenario {
  return {
    ...docData,
    createdAt: convertTimestamp(docData.createdAt),
    updatedAt: convertTimestamp(docData.updatedAt),
  } as ProviderScenario;
}

/**
 * Load scenarios from Firestore
 */
export async function loadScenariosFromFirebase(userId: string): Promise<ProviderScenario[]> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const scenariosRef = collection(db, `users/${userId}/scenarios`);
    const snapshot = await getDocs(scenariosRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const scenario = docToScenario(data);
      return {
        ...scenario,
        id: doc.id, // Ensure doc.id takes precedence
      };
    });
  } catch (error) {
    logger.error('Error loading scenarios from Firestore:', error);
    throw error;
  }
}

/**
 * Save a scenario to Firestore
 */
export async function saveScenarioToFirebase(
  userId: string,
  scenario: ProviderScenario
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const scenarioRef = doc(firestore, `users/${userId}/scenarios`, scenario.id);
    await setDoc(scenarioRef, {
      ...scenario,
      updatedAt: serverTimestamp(),
      createdAt: scenario.createdAt || serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error('Error saving scenario to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a scenario from Firestore
 */
export async function deleteScenarioFromFirebase(
  userId: string,
  scenarioId: string
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const scenarioRef = doc(firestore, `users/${userId}/scenarios`, scenarioId);
    await deleteDoc(scenarioRef);
  } catch (error) {
    logger.error('Error deleting scenario from Firestore:', error);
    throw error;
  }
}

/**
 * Load call pay scenarios from Firestore
 */
export async function loadCallPayScenariosFromFirebase(userId: string): Promise<CallScenario[]> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const scenariosRef = collection(db, `users/${userId}/callPayScenarios`);
    const snapshot = await getDocs(scenariosRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as CallScenario[];
  } catch (error) {
    logger.error('Error loading call pay scenarios from Firestore:', error);
    throw error;
  }
}

/**
 * Save call pay scenario to Firestore
 */
export async function saveCallPayScenarioToFirebase(
  userId: string,
  scenario: CallScenario
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const scenarioRef = doc(firestore, `users/${userId}/callPayScenarios`, scenario.id);
    await setDoc(scenarioRef, {
      ...scenario,
      updatedAt: serverTimestamp(),
      createdAt: scenario.createdAt || serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error('Error saving call pay scenario to Firestore:', error);
    throw error;
  }
}

/**
 * Load CF models from Firestore
 */
export async function loadCFModelsFromFirebase(userId: string): Promise<SavedCFModel[]> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const modelsRef = collection(db, `users/${userId}/cfModels`);
    const snapshot = await getDocs(modelsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as SavedCFModel[];
  } catch (error) {
    logger.error('Error loading CF models from Firestore:', error);
    throw error;
  }
}

/**
 * Save CF model to Firestore
 */
export async function saveCFModelToFirebase(
  userId: string,
  model: SavedCFModel
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const modelRef = doc(firestore, `users/${userId}/cfModels`, model.id);
    await setDoc(modelRef, {
      ...model,
      updatedAt: serverTimestamp(),
      createdAt: model.createdAt || serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error('Error saving CF model to Firestore:', error);
    throw error;
  }
}

/**
 * Load program catalog from Firestore
 */
export async function loadProgramCatalogFromFirebase(userId: string): Promise<{
  programs: CallProgram[];
  shiftTypes: ShiftType[];
}> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    // Load user-specific programs
    const programsRef = collection(db, 'programs');
    const programsQuery = query(programsRef, where('userId', '==', userId));
    const programsSnapshot = await getDocs(programsQuery);
    const programs = programsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CallProgram[];
    
    // Load user-specific shift types
    const shiftTypesRef = collection(db, 'shiftTypes');
    const shiftTypesQuery = query(shiftTypesRef, where('userId', '==', userId));
    const shiftTypesSnapshot = await getDocs(shiftTypesQuery);
    const shiftTypes = shiftTypesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ShiftType[];
    
    return { programs, shiftTypes };
  } catch (error) {
    logger.error('Error loading program catalog from Firestore:', error);
    throw error;
  }
}

/**
 * Save program catalog to Firestore
 */
export async function saveProgramCatalogToFirebase(
  userId: string,
  programs: CallProgram[],
  shiftTypes: ShiftType[]
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  // TypeScript guard: db is not null after the check above
  const firestore = db;

  try {
    // Save programs
    const programsPromises = programs.map(program => {
      const programRef = doc(firestore, 'programs', program.id);
      return setDoc(programRef, {
        ...program,
        userId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });

    // Save shift types
    const shiftTypesPromises = shiftTypes.map(shiftType => {
      const shiftTypeRef = doc(firestore, 'shiftTypes', shiftType.id);
      return setDoc(shiftTypeRef, {
        ...shiftType,
        userId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });

    await Promise.all([...programsPromises, ...shiftTypesPromises]);
  } catch (error) {
    logger.error('Error saving program catalog to Firestore:', error);
    throw error;
  }
}

/**
 * Load user preferences from Firestore
 */
export async function loadUserPreferencesFromFirebase(userId: string): Promise<{
  activeProgramId: string | null;
  modelingMode: 'quick' | 'advanced';
}> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const prefsRef = doc(firestore, `users/${userId}/preferences`, 'userPrefs');
    const prefsDoc = await getDoc(prefsRef);
    
    if (!prefsDoc.exists()) {
      return {
        activeProgramId: null,
        modelingMode: 'quick',
      };
    }

    const data = prefsDoc.data();
    return {
      activeProgramId: data.activeProgramId || null,
      modelingMode: data.modelingMode || 'quick',
    };
  } catch (error) {
    logger.error('Error loading user preferences from Firestore:', error);
    return {
      activeProgramId: null,
      modelingMode: 'quick',
    };
  }
}

/**
 * Save user preferences to Firestore
 */
export async function saveUserPreferencesToFirebase(
  userId: string,
  preferences: {
    activeProgramId: string | null;
    modelingMode: 'quick' | 'advanced';
  }
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const prefsRef = doc(firestore, `users/${userId}/preferences`, 'userPrefs');
    await setDoc(prefsRef, {
      ...preferences,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error('Error saving user preferences to Firestore:', error);
    throw error;
  }
}

/**
 * Load market data from Firestore
 */
export async function loadMarketDataFromFirebase(userId: string): Promise<SavedMarketData[]> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const marketDataRef = collection(db, `users/${userId}/marketData`);
    const snapshot = await getDocs(marketDataRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as SavedMarketData[];
  } catch (error) {
    logger.error('Error loading market data from Firestore:', error);
    throw error;
  }
}

/**
 * Save market data to Firestore
 */
export async function saveMarketDataToFirebase(
  userId: string,
  marketData: SavedMarketData
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const marketDataRef = doc(firestore, `users/${userId}/marketData`, marketData.id);
    await setDoc(marketDataRef, {
      ...marketData,
      updatedAt: serverTimestamp(),
      createdAt: marketData.createdAt || serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error('Error saving market data to Firestore:', error);
    throw error;
  }
}

/**
 * Delete market data from Firestore
 */
export async function deleteMarketDataFromFirebase(
  userId: string,
  dataId: string
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const marketDataRef = doc(firestore, `users/${userId}/marketData`, dataId);
    await deleteDoc(marketDataRef);
  } catch (error) {
    logger.error('Error deleting market data from Firestore:', error);
    throw error;
  }
}

/**
 * Bulk save market data to Firestore
 */
export async function bulkSaveMarketDataToFirebase(
  userId: string,
  marketDataArray: SavedMarketData[]
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const promises = marketDataArray.map(data => saveMarketDataToFirebase(userId, data));
    await Promise.all(promises);
  } catch (error) {
    logger.error('Error bulk saving market data to Firestore:', error);
    throw error;
  }
}

/**
 * Save feedback to Firestore
 */
export async function saveFeedbackToFirebase(
  userId: string,
  feedback: FeedbackData
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const feedbackRef = doc(firestore, `users/${userId}/feedback`, feedback.id);
    await setDoc(feedbackRef, {
      ...feedback,
      updatedAt: serverTimestamp(),
      createdAt: feedback.createdAt || serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error('Error saving feedback to Firestore:', error);
    throw error;
  }
}

/**
 * Load feedback from Firestore
 */
export async function loadFeedbackFromFirebase(userId: string): Promise<FeedbackData[]> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const feedbackRef = collection(db, `users/${userId}/feedback`);
    const snapshot = await getDocs(feedbackRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
    })) as FeedbackData[];
  } catch (error) {
    logger.error('Error loading feedback from Firestore:', error);
    throw error;
  }
}

/**
 * Load Provider WRVU Tracking state from Firestore
 */
export async function loadProviderWRVUTrackingFromFirebase(userId: string): Promise<ProviderWRVUTrackingState | null> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const trackingRef = doc(db, `users/${userId}/providerWRVUTracking`, 'trackingState');
    const trackingDoc = await getDoc(trackingRef);
    
    if (!trackingDoc.exists()) {
      return null;
    }

    return trackingDoc.data() as ProviderWRVUTrackingState;
  } catch (error) {
    logger.error('Error loading Provider WRVU Tracking from Firestore:', error);
    throw error;
  }
}

/**
 * Save Provider WRVU Tracking state to Firestore
 */
export async function saveProviderWRVUTrackingToFirebase(
  userId: string,
  state: ProviderWRVUTrackingState
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const trackingRef = doc(firestore, `users/${userId}/providerWRVUTracking`, 'trackingState');
    await setDoc(trackingRef, {
      ...state,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error('Error saving Provider WRVU Tracking to Firestore:', error);
    throw error;
  }
}

/**
 * Load draft state from Firestore
 */
export async function loadDraftStateFromFirebase(
  userId: string,
  screenId: string
): Promise<Record<string, unknown> | null> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  try {
    const draftRef = doc(db, `users/${userId}/draftStates`, screenId);
    const draftDoc = await getDoc(draftRef);
    
    if (!draftDoc.exists()) {
      return null;
    }

    const data = draftDoc.data();
    // Remove Firebase metadata
    const { updatedAt, createdAt, ...draftData } = data;
    return draftData as Record<string, unknown>;
  } catch (error) {
    logger.error(`Error loading draft state for ${screenId} from Firestore:`, error);
    throw error;
  }
}

/**
 * Recursively remove undefined values from an object so Firestore accepts it.
 * Firestore does not allow undefined as a field value; omit the field instead.
 */
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = stripUndefined(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Save draft state to Firestore
 */
export async function saveDraftStateToFirebase(
  userId: string,
  screenId: string,
  draftData: Record<string, unknown>
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const sanitized = stripUndefined(draftData);
    const draftRef = doc(firestore, `users/${userId}/draftStates`, screenId);
    await setDoc(draftRef, {
      ...sanitized,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error(`Error saving draft state for ${screenId} to Firestore:`, error);
    throw error;
  }
}

/**
 * Delete draft state from Firestore
 */
export async function deleteDraftStateFromFirebase(
  userId: string,
  screenId: string
): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured');
  }

  const firestore = db; // TypeScript guard

  try {
    const draftRef = doc(firestore, `users/${userId}/draftStates`, screenId);
    await deleteDoc(draftRef);
  } catch (error) {
    logger.error(`Error deleting draft state for ${screenId} from Firestore:`, error);
    throw error;
  }
}

