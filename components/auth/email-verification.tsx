'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { resendVerificationEmail } from '@/lib/firebase/auth';

interface EmailVerificationProps {
  email?: string;
  onVerified?: () => void;
}

export function EmailVerification({ email, onVerified }: EmailVerificationProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastSent, setLastSent] = useState<number | null>(null);

  const userEmail = email || user?.email || 'your email';

  const handleResend = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await resendVerificationEmail();
      setSuccess(true);
      setLastSent(Date.now());
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      let errorMessage = 'Failed to send verification email. Please try again.';
      
      if (err.message?.includes('already verified')) {
        errorMessage = 'Your email is already verified.';
        onVerified?.();
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

  const handleCheckVerification = () => {
    if (user?.emailVerified) {
      onVerified?.();
    } else {
      setError('Email is not yet verified. Please check your inbox and click the verification link.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <CardTitle className="text-yellow-900 dark:text-yellow-100">Verify Your Email</CardTitle>
        </div>
        <CardDescription className="text-yellow-800 dark:text-yellow-200">
          We've sent a verification email to <strong>{userEmail}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-yellow-200 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-900/30">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Please check your inbox and click the verification link to activate your account. 
            You may need to check your spam folder.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Verification email sent! Please check your inbox.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleResend}
            disabled={loading || success}
            variant="outline"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>

          <Button
            onClick={handleCheckVerification}
            variant="default"
            className="w-full"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            I've Verified My Email
          </Button>
        </div>

        {lastSent && (
          <p className="text-xs text-center text-yellow-700 dark:text-yellow-300">
            Last sent: {new Date(lastSent).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}






