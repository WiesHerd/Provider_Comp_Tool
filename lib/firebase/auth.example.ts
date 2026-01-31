/**
 * Firebase Authentication Helpers
 * 
 * Provides authentication functions and user management
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from './config';
import { logger } from '@/lib/utils/logger';

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    logger.error('Error signing in:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    logger.error('Error signing up:', error);
    throw error;
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
  }
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error) {
    logger.error('Error signing in with Google:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOutUser(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please check your Firebase configuration.');
  }
  try {
    await signOut(auth);
  } catch (error) {
    logger.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  if (!auth) {
    return null;
  }
  return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  if (!auth) {
    logger.warn('Firebase Auth is not initialized. Auth state changes will not be tracked.');
    // Return a no-op unsubscribe function
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}


