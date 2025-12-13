'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';

/**
 * Auth Provider Component
 * 
 * Initializes Firebase authentication once at app startup.
 * This is the only place where auth initialization should happen.
 * All redirect logic is handled by RouteGuard.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const cleanup = useAuthStore((state) => state.cleanup);

  useEffect(() => {
    // Initialize auth state listener once at app startup
    // The initialize() function is idempotent, so calling it multiple times is safe
    initialize().catch((error) => {
      console.error('Failed to initialize authentication:', error);
    });

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [initialize, cleanup]);

  return <>{children}</>;
}








