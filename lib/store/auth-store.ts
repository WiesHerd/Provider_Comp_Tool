/**
 * Authentication Store
 * 
 * Zustand store for managing authentication state
 * Single source of truth for authentication in the application
 */

'use client';

import { create } from 'zustand';
import { User } from 'firebase/auth';
import { signIn, signUp, signInWithGoogle, signOutUser, onAuthStateChange } from '@/lib/firebase/auth';
import { logger } from '@/lib/utils/logger';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  isInitializing: boolean;
  unsubscribe?: () => void;
  initPromise?: Promise<void>;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  cleanup: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  isInitializing: false,

  setUser: (user) => {
    const prevUser = get().user;
    set({ user });
    
    // Debug logging (dev only)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      if (user && !prevUser) {
        logger.log('🔐 Auth: User signed in', { email: user.email, uid: user.uid, emailVerified: user.emailVerified });
      } else if (!user && prevUser) {
        logger.log('🔐 Auth: User signed out');
      } else if (user && prevUser && user.uid !== prevUser.uid) {
        logger.log('🔐 Auth: User changed', { from: prevUser.email, to: user.email });
      }
    }
  },
  
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    const state = get();
    
    // Idempotent: if already initialized, return existing promise or resolve immediately
    if (state.initialized) {
      if (state.initPromise) {
        return state.initPromise;
      }
      return Promise.resolve();
    }
    
    // If already initializing, return the existing promise
    if (state.isInitializing && state.initPromise) {
      return state.initPromise;
    }
    
    // Create initialization promise
    const initPromise = new Promise<void>((resolve) => {
      set({ isInitializing: true, initialized: true, loading: true });
      
      // Set timeout protection (10 seconds max)
      const timeoutId = setTimeout(() => {
        const currentState = get();
        if (currentState.loading) {
          logger.warn('⚠️ Auth: Initialization timeout after 10s - setting loading to false');
          set({ loading: false, isInitializing: false });
          resolve();
        }
      }, 10000); // 10 second timeout
      
      // Subscribe to auth state changes
      const unsubscribe = onAuthStateChange((user) => {
        clearTimeout(timeoutId); // Clear timeout if callback fires
        
        const prevUser = get().user;
        set({ 
          user, 
          loading: false, 
          isInitializing: false 
        });
        
        // Debug logging (dev only)
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          if (user && !prevUser) {
            logger.log('🔐 Auth: Initial state - User signed in', { 
              email: user.email, 
              uid: user.uid, 
              emailVerified: user.emailVerified 
            });
          } else if (!user) {
            logger.log('🔐 Auth: Initial state - No user');
          }
        }
        
        // Store unsubscribe function for cleanup
        set({ unsubscribe });
        resolve();
      });
    });
    
    set({ initPromise });
    return initPromise;
  },

  login: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const user = await signIn(email, password);
      // User will be set by onAuthStateChange listener, but set it here too for immediate UI update
      set({ user, loading: false });
      logger.log('🔐 Auth: Login successful', { email: user.email });
    } catch (error) {
      set({ loading: false });
      logger.error('🔐 Auth: Login failed', error);
      throw error;
    }
  },

  register: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const user = await signUp(email, password);
      // User will be set by onAuthStateChange listener, but set it here too for immediate UI update
      set({ user, loading: false });
      logger.log('🔐 Auth: Registration successful', { email: user.email, uid: user.uid });
      return user;
    } catch (error) {
      set({ loading: false });
      logger.error('🔐 Auth: Registration failed', error);
      throw error;
    }
  },

  loginWithGoogle: async () => {
    try {
      set({ loading: true });
      const user = await signInWithGoogle();
      // User will be set by onAuthStateChange listener, but set it here too for immediate UI update
      set({ user, loading: false });
      logger.log('🔐 Auth: Google login successful', { email: user.email });
    } catch (error) {
      set({ loading: false });
      logger.error('🔐 Auth: Google login failed', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ loading: true });
      await signOutUser();
      set({ user: null, loading: false });
      logger.log('🔐 Auth: Logout successful');
    } catch (error) {
      set({ loading: false });
      logger.error('🔐 Auth: Logout failed', error);
      throw error;
    }
  },

  cleanup: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: undefined });
      logger.log('🔐 Auth: Cleanup completed - unsubscribed from auth state changes');
    }
  },
}));


