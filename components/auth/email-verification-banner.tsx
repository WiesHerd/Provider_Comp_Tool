'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { resendVerificationEmail } from '@/lib/firebase/auth';
import { cn } from '@/lib/utils/cn';

/**
 * Email Verification Banner Component
 * 
 * Non-blocking banner that appears at the top of the app for unverified users.
 * Users can dismiss it and continue using the app.
 * Email verification is not required to access the application.
 */
export function EmailVerificationBanner() {
  const { user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset dismissed state when user changes or email becomes verified
  useEffect(() => {
    if (user?.emailVerified) {
      setDismissed(false);
    }
  }, [user?.emailVerified]);

  // Don't show banner if:
  // - No user
  // - Email is verified
  // - Banner is dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await resendVerificationEmail();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      let errorMessage = 'Failed to send verification email. Please try again.';
      
      if (err.message?.includes('already verified')) {
        errorMessage = 'Your email is already verified.';
        // User might have verified in another tab - refresh auth state
        window.location.reload();
      } else if (err.message?.includes('wait a moment')) {
        errorMessage = err.message;
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in localStorage to persist across page refreshes
    if (user?.uid) {
      localStorage.setItem(`email-verification-dismissed-${user.uid}`, 'true');
    }
  };

  // Check if user previously dismissed the banner
  useEffect(() => {
    if (user?.uid) {
      const wasDismissed = localStorage.getItem(`email-verification-dismissed-${user.uid}`);
      if (wasDismissed === 'true') {
        setDismissed(true);
      }
    }
  }, [user?.uid]);

  return (
    <Alert className={cn(
      "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 rounded-none border-x-0 border-t-0 mb-0",
      "sticky top-0 z-50 shadow-sm"
    )}>
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-yellow-900 dark:text-yellow-100 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <strong>Verify your email address</strong>
                <span className="hidden sm:inline">: </span>
                <span className="block sm:inline">
                  We've sent a verification email to <strong>{user.email}</strong>. 
                  Please check your inbox and click the verification link.
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {success && (
                  <span className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Sent!
                  </span>
                )}
                {error && (
                  <span className="text-xs text-red-700 dark:text-red-300 max-w-[200px] truncate">
                    {error}
                  </span>
                )}
                <Button
                  onClick={handleResend}
                  disabled={loading || success}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Resend
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/50"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

