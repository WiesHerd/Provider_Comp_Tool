/**
 * Authentication Utility Functions
 * 
 * Provides helper functions for authentication verification and user management
 */

'use client';

import { User } from 'firebase/auth';
import { auth } from './config';
import { logger } from '@/lib/utils/logger';

/**
 * Get current authenticated user ID
 * Throws error if user is not authenticated
 */
export function getCurrentUserId(): string {
  const user = auth?.currentUser;
  if (!user || !user.uid) {
    throw new Error('User is not authenticated. Please sign in to continue.');
  }
  return user.uid;
}

/**
 * Get current authenticated user ID (safe - returns null if not authenticated)
 */
export function getCurrentUserIdSafe(): string | null {
  try {
    return getCurrentUserId();
  } catch {
    return null;
  }
}

/**
 * Verify user is authenticated
 * Returns true if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return auth?.currentUser !== null && auth?.currentUser !== undefined;
}

/**
 * Get current user object
 */
export function getCurrentUser(): User | null {
  return auth?.currentUser || null;
}

/**
 * Verify authentication and get user ID
 * Throws error with helpful message if not authenticated
 */
export function requireAuth(): string {
  if (!auth) {
    throw new Error('Firebase is not configured. Please check your configuration.');
  }
  
  const user = auth.currentUser;
  if (!user || !user.uid) {
    throw new Error('Authentication required. Please sign in to access this feature.');
  }
  
  return user.uid;
}

/**
 * Verify that a userId matches the current authenticated user
 * Throws error if userId doesn't match or user is not authenticated
 */
export function verifyUserId(userId: string): void {
  const currentUserId = requireAuth();
  if (currentUserId !== userId) {
    logger.error('UserId mismatch:', { currentUserId, providedUserId: userId });
    throw new Error('Unauthorized: User ID does not match authenticated user.');
  }
}










