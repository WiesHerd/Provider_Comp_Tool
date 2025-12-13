'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, LogIn, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { validatePassword, passwordsMatch } from '@/lib/utils/password-validator';
import { cn } from '@/lib/utils/cn';
import { FirebaseStatus } from './firebase-status';
import { SignupSuccess } from './signup-success';

interface LoginFormProps {
  onSuccess?: () => void;
  showSignUp?: boolean;
}

export function LoginForm({ onSuccess, showSignUp = false }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(showSignUp);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<ReturnType<typeof validatePassword> | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ email: string; userId: string } | null>(null);
  
  const { login, register, loginWithGoogle, loading } = useAuthStore();

  // Validate password in real-time
  useEffect(() => {
    if (isSignUp && password) {
      const validation = validatePassword(password);
      setPasswordValidation(validation);
      if (validation.isValid) {
        setPasswordError(null);
      } else {
        setPasswordError(validation.errors[0] || 'Password does not meet requirements');
      }
    } else {
      setPasswordValidation(null);
      setPasswordError(null);
    }
  }, [password, isSignUp]);

  // Validate password confirmation in real-time
  useEffect(() => {
    if (isSignUp && confirmPassword) {
      if (!passwordsMatch(password, confirmPassword)) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError(null);
      }
    } else {
      setConfirmPasswordError(null);
    }
  }, [password, confirmPassword, isSignUp]);

  // Validate email format
  useEffect(() => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setIsSubmitting(true);

    // Client-side validation
    if (isSignUp) {
      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }

      // Validate password
      if (!password) {
        setPasswordError('Password is required');
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setPasswordError(passwordValidation.errors[0] || 'Password does not meet requirements');
        return;
      }

      // Validate password confirmation
      if (!confirmPassword) {
        setConfirmPasswordError('Please confirm your password');
        return;
      }

      if (!passwordsMatch(password, confirmPassword)) {
        setConfirmPasswordError('Passwords do not match');
        return;
      }
    } else {
      // Sign-in validation
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }

      if (!password) {
        setPasswordError('Password is required');
        return;
      }
    }

    try {
      if (isSignUp) {
        console.log('🔄 Starting sign-up process...', { email, passwordLength: password.length });
        try {
          const user = await register(email, password);
          console.log('✅ Register function returned:', user);
          setIsSubmitting(false);
          
          if (user && user.uid) {
            console.log('✅ Sign-up successful! User created:', user.uid, user.email);
            
            // Store created user info for success modal
            setCreatedUser({
              email: user.email || email,
              userId: user.uid
            });
            
            // Show success modal
            setShowSuccessModal(true);
            
            // Also set success message as backup
            setSuccess(`✅ Account created successfully! Check your email for verification.`);
            
            // Verify user is actually in Firebase by checking auth state
            console.log('🔍 Verifying user in Firebase Auth...');
            const { auth } = await import('@/lib/firebase/config');
            if (auth?.currentUser) {
              console.log('✅ Confirmed: User is in Firebase Auth:', auth.currentUser.uid);
              console.log('✅ User stored in Firebase Authentication database');
            } else {
              console.warn('⚠️ Warning: User not found in auth.currentUser immediately after sign-up');
            }
          } else {
            console.error('❌ ERROR: Register returned invalid user object:', user);
            setError('Account creation failed: Invalid user object returned. Please try again.');
          }
          
          // Clear form after successful sign-up
          setTimeout(() => {
            setPassword('');
            setConfirmPassword('');
          }, 3000);
        } catch (registerError: any) {
          console.error('❌ Register function threw error:', registerError);
          throw registerError; // Re-throw to be caught by outer catch
        }
      } else {
        await login(email, password);
        setIsSubmitting(false);
        
        // Wait for auth state to update in the store
        // The auth store will update via onAuthStateChanged listener
        // RouteGuard will handle the redirect automatically
        setSuccess(`Successfully signed in as ${email}. Redirecting...`);
        
        // Call onSuccess callback - RouteGuard will handle redirect
        // No need for manual redirect or timeout
        onSuccess?.();
      }
    } catch (err: any) {
      // Log the full error for debugging - ALWAYS log in production
      console.error('❌ SIGN-UP/LOGIN ERROR:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error message:', err.message);
      console.error('❌ Full error object:', JSON.stringify(err, null, 2));
      
      // Handle Firebase auth errors with user-friendly messages
      let errorMessage = 'An error occurred. Please try again.';
      
      // Check if Firebase is not configured
      if (err.message && err.message.includes('Firebase is not configured')) {
        errorMessage = 'Firebase is not configured. Please check your environment variables and contact support.';
      } else if (err.message && err.message.includes('Firebase Authentication is not configured')) {
        errorMessage = 'Firebase Authentication is not configured. Please check your Firebase settings.';
      }
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Please sign up or check your email.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect password. Please try again or reset your password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later or reset your password.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method. Please use the original method or link accounts.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = '❌ CRITICAL: Email/password sign-in is NOT ENABLED in Firebase Console! Go to Firebase Console > Authentication > Sign-in method > Email/Password and enable it.';
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        // Include error code in message if available for debugging
        errorMessage = `Sign-up failed${err.code ? ` (${err.code})` : ''}. Please check the browser console for details.`;
      }
      
      console.error('❌ Setting error message in UI:', errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
      
      // Also show alert for critical errors
      if (err.code === 'auth/operation-not-allowed') {
        alert('CRITICAL ERROR: Email/Password authentication is not enabled in Firebase Console!\n\nPlease:\n1. Go to Firebase Console\n2. Authentication > Sign-in method\n3. Enable Email/Password\n4. Try again');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      setIsSubmitting(false);
      
      // Wait for auth state to update - RouteGuard will handle redirect
      setSuccess('Successfully signed in with Google. Redirecting...');
      onSuccess?.();
    } catch (err: any) {
      setIsSubmitting(false);
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      
      if (err.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using email/password. Please sign in with your password or link your accounts.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  // Reset form when switching between sign-in and sign-up
  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setPassword('');
    setConfirmPassword('');
    setPasswordValidation(null);
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-blue-500';
      case 'very-strong':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <>
      {showSuccessModal && createdUser && (
        <SignupSuccess
          email={createdUser.email}
          userId={createdUser.userId}
          onClose={() => {
            setShowSuccessModal(false);
            setCreatedUser(null);
          }}
        />
      )}
      <div className="w-full max-w-md mx-auto">
        <FirebaseStatus />
        <Card className="w-full">
        <CardHeader>
          <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
        <CardDescription>
          {isSignUp 
            ? 'Create an account to sync your data across devices'
            : 'Sign in to access your saved scenarios and data'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="shadow-lg">
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn("pl-10", emailError && "border-red-500 focus-visible:ring-red-500")}
                required
                disabled={loading}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
              />
            </div>
            {emailError && (
              <p id="email-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {emailError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isSignUp ? "Create a strong password" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn("pl-10 pr-10", passwordError && "border-red-500 focus-visible:ring-red-500")}
                required
                minLength={isSignUp ? 8 : 6}
                disabled={loading}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && (
              <p id="password-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {passwordError}
              </p>
            )}
            {isSignUp && password && passwordValidation && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-300", getStrengthColor(passwordValidation.strength.level))}
                      style={{ width: `${passwordValidation.strength.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium capitalize text-gray-600 dark:text-gray-400">
                    {passwordValidation.strength.level.replace('-', ' ')}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p className="font-medium">Password requirements:</p>
                  <ul className="space-y-0.5">
                    <li className={cn("flex items-center gap-1", passwordValidation.requirements.minLength ? "text-green-600 dark:text-green-400" : "")}>
                      {passwordValidation.requirements.minLength ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      At least 8 characters
                    </li>
                    <li className={cn("flex items-center gap-1", passwordValidation.requirements.hasUppercase ? "text-green-600 dark:text-green-400" : "")}>
                      {passwordValidation.requirements.hasUppercase ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      One uppercase letter
                    </li>
                    <li className={cn("flex items-center gap-1", passwordValidation.requirements.hasLowercase ? "text-green-600 dark:text-green-400" : "")}>
                      {passwordValidation.requirements.hasLowercase ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      One lowercase letter
                    </li>
                    <li className={cn("flex items-center gap-1", passwordValidation.requirements.hasNumber ? "text-green-600 dark:text-green-400" : "")}>
                      {passwordValidation.requirements.hasNumber ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      One number
                    </li>
                    <li className={cn("flex items-center gap-1", passwordValidation.requirements.hasSpecialChar ? "text-green-600 dark:text-green-400" : "")}>
                      {passwordValidation.requirements.hasSpecialChar ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      One special character
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn("pl-10 pr-10", confirmPasswordError && "border-red-500 focus-visible:ring-red-500")}
                  required
                  disabled={loading}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPasswordError && (
                <p id="confirm-password-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {confirmPasswordError}
                </p>
              )}
              {confirmPassword && !confirmPasswordError && passwordsMatch(password, confirmPassword) && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || isSubmitting}>
            {(loading || isSubmitting) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignUp ? 'Creating...' : 'Signing in...'}
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </>
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={loading || isSubmitting}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-primary hover:underline"
            disabled={loading}
          >
            {isSignUp 
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"
            }
          </button>
        </div>
      </CardContent>
    </Card>
    </div>
    </>
  );
}







