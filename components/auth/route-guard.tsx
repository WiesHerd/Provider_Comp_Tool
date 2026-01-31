'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { useTrialStatus } from '@/hooks/use-trial-status';
import { TrialExpiredModal } from './trial-expired-modal';

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
  const { userProfile, needsUpgrade, entitlement, loading: trialLoading } = useTrialStatus();
  const hasRedirected = useRef(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  
  const isAuthPage = pathname === '/auth' || pathname === '/auth.html';
  const isPricingPage = pathname === '/pricing';
  const isPublicPage = isAuthPage || isPricingPage;
  const isFirebaseConfigured = auth !== null;

  // If we navigate to a public page (auth/pricing), ensure the trial modal is closed.
  // Otherwise it can "stick" open and block interaction with the pricing / checkout UI.
  useEffect(() => {
    if (isPublicPage && showTrialModal) {
      setShowTrialModal(false);
    }
  }, [isPublicPage, showTrialModal]);

  // Soft gate: do NOT block the whole app when trial expires.
  // Instead, open the upgrade modal only when the user tries to access a locked feature.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => {
      // Don't show upgrade modal on auth/pricing pages (those should always be accessible).
      if (isPublicPage) return;
      setShowTrialModal(true);
    };

    window.addEventListener('complens:upgrade-required', handler as EventListener);
    return () => {
      window.removeEventListener('complens:upgrade-required', handler as EventListener);
    };
  }, [isPublicPage]);

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

    // If Firebase is not configured, redirect to /auth (except if on public pages)
    if (!isFirebaseConfigured && !isPublicPage) {
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

    // If not authenticated and not on public page, redirect to /auth
    if (!user && !isPublicPage) {
      // Store the intended destination for redirect after login
      const currentPath = pathname + (typeof window !== 'undefined' ? window.location.search : '');
      if (currentPath !== '/auth' && currentPath !== '/auth.html') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      hasRedirected.current = true;
      router.replace('/auth');
      return;
    }

    // Trial-only access enforcement (per plan):
    // If the user is signed in but their entitlement is expired, do not allow access
    // to protected routes. Keep /pricing and /auth always accessible.
    if (user && !isPublicPage) {
      // Only enforce when profile has loaded (avoid flashing redirects).
      // If profile is missing, treat as not-enforced here; Pricing can guide user.
      if (entitlement === 'expired') {
        // Store intended destination so they can resume after upgrading.
        const currentPath = pathname + (typeof window !== 'undefined' ? window.location.search : '');
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        hasRedirected.current = true;
        router.replace('/pricing');
        return;
      }
    }
  }, [user, loading, initialized, isAuthPage, isFirebaseConfigured, router, pathname, entitlement, isPublicPage]);

  // Reset redirect flag when pathname changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  // Show loading while auth is initializing or trial status is loading
  if (!initialized || loading || (user && trialLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If Firebase is not configured, show error (except on public pages)
  if (!isFirebaseConfigured && !isPublicPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on public page, show loading (redirect will happen)
  if (!user && !isPublicPage) {
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
  // OR user is not authenticated and on public page (auth or pricing)
  // Note: Email verification is non-blocking - unverified users can access the app
  return (
    <>
      {children}
      <TrialExpiredModal 
        userProfile={userProfile} 
        open={!!user && needsUpgrade && showTrialModal}
        onOpenChange={setShowTrialModal}
      />
    </>
  );
}

