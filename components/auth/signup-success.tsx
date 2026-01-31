'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SignupSuccessProps {
  email: string;
  userId: string;
  onClose?: () => void;
}

export function SignupSuccess({ email, userId, onClose }: SignupSuccessProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl border-green-500/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Account Created Successfully!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Your account has been created and saved to Firebase Authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Details */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">User ID:</span>
              <span className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                {userId.substring(0, 8)}...
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Active
              </span>
            </div>
          </div>

          {/* Email Verification Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Verification Email Sent
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  We've sent a verification email to <strong>{email}</strong>. 
                  Please check your inbox (and spam folder) and click the verification link to activate your account.
                </p>
              </div>
            </div>
          </div>

          {/* Welcome Email Notice */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  Welcome Email Sent
                </h4>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  A welcome email with account details has been sent to your email address.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => {
                if (onClose) {
                  onClose();
                } else {
                  router.push('/');
                }
              }}
              className="w-full"
              size="lg"
            >
              Continue to App
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.open(`https://console.firebase.google.com/project/complens-88a4f/authentication/users`, '_blank');
              }}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View in Firebase Console
            </Button>
          </div>

          {/* Info */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Your account is stored securely in Firebase Authentication. 
            You can verify this in the Firebase Console.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

