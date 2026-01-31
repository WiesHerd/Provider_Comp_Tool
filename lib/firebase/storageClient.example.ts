/**
 * Firebase Storage Client Example
 * 
 * This is a template for the Firebase storage client that will replace
 * the current localStorage-based storageClient.ts
 * 
 * This maintains the same interface so existing stores can be easily updated
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';
import { logger } from '@/lib/utils/logger';
import type { ProviderScenario } from '@/types';
import type { CallScenario } from '@/types/call-scenarios';
import type { SavedCFModel } from '@/types/cf-models';
import type { CallProgram, ShiftType } from '@/types/call-program';

/**
 * Get current user ID (from auth context)
 * This should be passed from the auth store
 */
function getUserId(): string | null {
  // TODO: Get from auth store
  return null;
}

/**
 * Load provider scenarios from Firestore
 */
export async function loadScenarios(userId: string): Promise<ProviderScenario[]> {
  try {
    const scenariosRef = collection(db, `users/${userId}/scenarios`);
    const snapshot = await getDocs(scenariosRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ProviderScenario[];
  } catch (error) {
    logger.error('Error loading scenarios from Firestore:', error);
    return [];
  }
}

/**
 * Save a scenario to Firestore
 */
export async function saveScenario(
  userId: string, 
  scenario: ProviderScenario
): Promise<void> {
  try {
    const scenarioRef = doc(db, `users/${userId}/scenarios`, scenario.id);
    await setDoc(scenarioRef, {
      ...scenario,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Error saving scenario to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a scenario from Firestore
 */
export async function deleteScenario(
  userId: string, 
  scenarioId: string
): Promise<void> {
  try {
    const scenarioRef = doc(db, `users/${userId}/scenarios`, scenarioId);
    await deleteDoc(scenarioRef);
  } catch (error) {
    logger.error('Error deleting scenario from Firestore:', error);
    throw error;
  }
}

/**
 * Load call pay scenarios
 */
export async function loadCallPayScenarios(userId: string): Promise<CallScenario[]> {
  try {
    const scenariosRef = collection(db, `users/${userId}/callPayScenarios`);
    const snapshot = await getDocs(scenariosRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CallScenario[];
  } catch (error) {
    logger.error('Error loading call pay scenarios from Firestore:', error);
    return [];
  }
}

/**
 * Save call pay scenario
 */
export async function saveCallPayScenario(
  userId: string, 
  scenario: CallScenario
): Promise<void> {
  try {
    const scenarioRef = doc(db, `users/${userId}/callPayScenarios`, scenario.id);
    await setDoc(scenarioRef, {
      ...scenario,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Error saving call pay scenario to Firestore:', error);
    throw error;
  }
}

/**
 * Load CF models
 */
export async function loadCFModels(userId: string): Promise<SavedCFModel[]> {
  try {
    const modelsRef = collection(db, `users/${userId}/cfModels`);
    const snapshot = await getDocs(modelsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SavedCFModel[];
  } catch (error) {
    logger.error('Error loading CF models from Firestore:', error);
    return [];
  }
}

/**
 * Save CF model
 */
export async function saveCFModel(
  userId: string, 
  model: SavedCFModel
): Promise<void> {
  try {
    const modelRef = doc(db, `users/${userId}/cfModels`, model.id);
    await setDoc(modelRef, {
      ...model,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Error saving CF model to Firestore:', error);
    throw error;
  }
}

/**
 * Load program catalog (can be shared or user-specific)
 */
export async function loadProgramCatalog(userId: string): Promise<{
  programs: CallProgram[];
  shiftTypes: ShiftType[];
}> {
  try {
    // Load user-specific programs
    const userProgramsRef = collection(db, 'programs');
    const userProgramsQuery = query(userProgramsRef, where('userId', '==', userId));
    const userProgramsSnapshot = await getDocs(userProgramsQuery);
    const userPrograms = userProgramsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CallProgram[];
    
    // Load user-specific shift types
    const userShiftTypesRef = collection(db, 'shiftTypes');
    const userShiftTypesQuery = query(userShiftTypesRef, where('userId', '==', userId));
    const userShiftTypesSnapshot = await getDocs(userShiftTypesQuery);
    const userShiftTypes = userShiftTypesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ShiftType[];
    
    return {
      programs: userPrograms,
      shiftTypes: userShiftTypes,
    };
  } catch (error) {
    logger.error('Error loading program catalog from Firestore:', error);
    return { programs: [], shiftTypes: [] };
  }
}

/**
 * Real-time listener example
 * Use this for real-time updates across devices
 */
export function subscribeToScenarios(
  userId: string,
  callback: (scenarios: ProviderScenario[]) => void
): () => void {
  const scenariosRef = collection(db, `users/${userId}/scenarios`);
  
  // TODO: Use onSnapshot for real-time updates
  // import { onSnapshot } from 'firebase/firestore';
  // return onSnapshot(scenariosRef, (snapshot) => {
  //   const scenarios = snapshot.docs.map(doc => ({
  //     id: doc.id,
  //     ...doc.data(),
  //   })) as ProviderScenario[];
  //   callback(scenarios);
  // });
  
  // Placeholder
  return () => {};
}


