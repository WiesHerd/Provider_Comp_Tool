'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { LoginForm } from '@/components/auth/login-form';
import { Loader2 } from 'lucide-react';

/**
 * Auth Client Component
 * 
 * Renders the login/signup form on the /auth page.
 * - No duplicate initialization (handled by AuthProvider)
 * - No redirect logic (handled by RouteGuard)
 * - Email verification is non-blocking (users can access app even if unverified)
 */
export default function AuthClient() {
  const { loading, initialized } = useAuthStore();

  // Show loading while auth is initializing
  // RouteGuard will handle redirects, so we just need to show loading here
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render login form
  // RouteGuard will redirect authenticated users away from this page
  // Email verification banner will be shown in the main app for unverified users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <LoginForm 
          onSuccess={() => {
            // Redirect will be handled by RouteGuard when auth state updates
            // No need to manually redirect here
          }}
        />
      </div>
    </div>
  );
}





