'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication.
 * Redirects to /auth if user is not logged in.
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth',
  requireAuth = true 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      useAuthStore.getState().initialize();
    }
  }, [initialized]);

  useEffect(() => {
    if (!loading && initialized && requireAuth && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, initialized, requireAuth, redirectTo, router]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}












