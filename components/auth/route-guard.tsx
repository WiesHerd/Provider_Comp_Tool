'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase/config';

/**
 * Route Guard Component
 * 
 * Protects routes by requiring authentication.
 * - Redirects unauthenticated users to /auth
 * - Redirects authenticated users away from /auth to home
 * - Allows unverified users to access the app (email verification is non-blocking)
 * - Uses Next.js router only (no window.location redirects)
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, initialized } = useAuthStore();
  const hasRedirected = useRef(false);
  
  const isAuthPage = pathname === '/auth' || pathname === '/auth.html';
  const isFirebaseConfigured = auth !== null;

  // Single redirect effect - wait for auth to be ready before redirecting
  useEffect(() => {
    // Don't redirect until auth is initialized and not loading
    if (!initialized || loading) {
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current) {
      return;
    }

    // If Firebase is not configured, redirect to /auth (except if already there)
    if (!isFirebaseConfigured && !isAuthPage) {
      console.error('Firebase is not configured. Authentication is required.');
      hasRedirected.current = true;
      router.replace('/auth');
      return;
    }

    // If authenticated user is on auth page, redirect to home
    if (user && isAuthPage) {
      // Check for stored redirect path
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath && redirectPath !== '/auth' && redirectPath !== '/auth.html') {
        sessionStorage.removeItem('redirectAfterLogin');
        hasRedirected.current = true;
        router.replace(redirectPath);
      } else {
        hasRedirected.current = true;
        router.replace('/');
      }
      return;
    }

    // If not authenticated and not on auth page, redirect to /auth
    if (!user && !isAuthPage) {
      // Store the intended destination for redirect after login
      const currentPath = pathname + (typeof window !== 'undefined' ? window.location.search : '');
      if (currentPath !== '/auth' && currentPath !== '/auth.html') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      hasRedirected.current = true;
      router.replace('/auth');
      return;
    }
  }, [user, loading, initialized, isAuthPage, isFirebaseConfigured, router, pathname]);

  // Reset redirect flag when pathname changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  // Show loading while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If Firebase is not configured, show error (except on auth page)
  if (!isFirebaseConfigured && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on auth page, show loading (redirect will happen)
  if (!user && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If authenticated and on auth page, show loading (redirect will happen)
  if (user && isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Render children - user is authenticated and on a protected route
  // OR user is not authenticated and on auth page
  // Note: Email verification is non-blocking - unverified users can access the app
  return <>{children}</>;
}

