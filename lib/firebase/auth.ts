/**
 * Firebase Authentication Helpers
 * 
 * Provides authentication functions and user management
 * 
 * NOTE: This file must only be imported in client components ('use client')
 */

'use client';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  linkWithCredential,
} from 'firebase/auth';
import { auth } from './config';
import { logger } from '@/lib/utils/logger';

// Check if Firebase is configured
if (!auth) {
  logger.warn('Firebase Auth is not configured. Authentication features will be disabled.');
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase is not configured. Please check your .env.local file and restart the dev server.');
  }
  try {
    logger.log('🔐 Signing in with Firebase Authentication...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    logger.log('✅ Successfully signed in with Firebase Authentication:', {
      userId: user.uid,
      email: user.email,
      emailVerified: user.emailVerified
    });
    
    // Update last login timestamp
    try {
      const { updateLastLogin } = await import('./user-profile');
      await updateLastLogin(user.uid);
      logger.log('✅ Last login timestamp updated in Firestore');
    } catch (profileError) {
      logger.error('Error updating last login:', profileError);
      // Don't throw - this is a non-critical operation
    }
    
    return user;
  } catch (error) {
    logger.error('Error signing in:', error);
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string): Promise<User> {
  console.log('🔐 signUp function called');
  console.log('🔍 Auth object check:', { authExists: !!auth, authType: typeof auth });
  
  if (!auth) {
    const errorMsg = 'Firebase Authentication is not configured. Please check your Firebase environment variables.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }
  
  try {
    console.log('🔐 Creating user account in Firebase Authentication...', { email });
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ User account created in Firebase Authentication:', {
      userId: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      providerId: user.providerId
    });
    
    // Send verification email
    try {
      const url = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth?verified=true`
        : 'https://complens-88a4f.web.app/auth?verified=true';
      await sendEmailVerification(user, { url });
      console.log('✅ Verification email sent to:', user.email);
    } catch (verificationError: any) {
      logger.error('Error sending verification email:', verificationError);
      console.error('Verification email error details:', {
        code: verificationError?.code,
        message: verificationError?.message
      });
      // Don't throw - verification email failure shouldn't block sign-up
    }
    
    // Create user profile after successful sign-up
    try {
      const { createOrUpdateUserProfile } = await import('./user-profile');
      await createOrUpdateUserProfile(user, { signUpMethod: 'email' });
      console.log('✅ User profile saved to Firestore database');
    } catch (profileError) {
      logger.error('❌ Error creating user profile after sign-up:', profileError);
      // Don't throw - profile creation failure shouldn't block sign-up
    }
    
    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import('./welcome-email');
      await sendWelcomeEmail(user);
      console.log('✅ Welcome email sent to:', user.email);
    } catch (welcomeError) {
      logger.error('Error sending welcome email:', welcomeError);
      // Don't throw - welcome email failure shouldn't block sign-up
    }
    
    console.log('✅ signUp function completed successfully, returning user:', user.uid);
    return user;
  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in signUp function:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error code:', error?.code);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    logger.error('❌ Error signing up:', error);
    throw error;
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase is not configured. Please check your .env.local file and restart the dev server.');
  }
  try {
    const provider = new GoogleAuthProvider();
    // Add email scope to get user's email
    provider.addScope('email');
    provider.addScope('profile');
    
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    // Create or update user profile after successful sign-in
    try {
      const { createOrUpdateUserProfile } = await import('./user-profile');
      await createOrUpdateUserProfile(user, { signUpMethod: 'google' });
    } catch (profileError) {
      logger.error('Error creating/updating user profile after Google sign-in:', profileError);
      // Don't throw - profile creation failure shouldn't block sign-in
    }
    
    return user;
  } catch (error: any) {
    logger.error('Error signing in with Google:', error);
    
    // Handle account linking scenarios
    if (error.code === 'auth/account-exists-with-different-credential') {
      const email = error.customData?.email;
      throw new Error(`An account already exists with ${email} using email/password. Please sign in with your password first, then you can link your Google account.`);
    } else if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please sign in with your password or link your accounts.');
    }
    
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOutUser(): Promise<void> {
  if (!auth) {
    logger.warn('Firebase Auth not configured - signOut skipped');
    return;
  }
  try {
    await signOut(auth);
  } catch (error) {
    logger.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth?.currentUser || null;
}

/**
 * Send email verification to current user
 */
export async function sendVerificationEmail(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase is not configured. Please check your .env.local file and restart the dev server.');
  }
  
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in.');
  }
  
  if (user.emailVerified) {
    throw new Error('Email is already verified.');
  }
  
  try {
    await sendEmailVerification(user);
    logger.log('Verification email sent to:', user.email);
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
}

/**
 * Resend email verification (with rate limiting check)
 */
export async function resendVerificationEmail(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase is not configured. Please check your .env.local file and restart the dev server.');
  }
  
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in.');
  }
  
  if (user.emailVerified) {
    throw new Error('Email is already verified.');
  }
  
  // Check rate limiting (Firebase has built-in rate limiting, but we can add client-side check)
  const lastSent = sessionStorage.getItem(`verification-email-sent-${user.uid}`);
  if (lastSent) {
    const timeSinceLastSent = Date.now() - parseInt(lastSent, 10);
    const oneMinute = 60 * 1000;
    if (timeSinceLastSent < oneMinute) {
      throw new Error('Please wait a moment before requesting another verification email.');
    }
  }
  
  try {
    // Get the current URL for the verification link
    const url = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth`
      : 'https://complens-88a4f.web.app/auth';
    
    await sendEmailVerification(user, {
      url: url, // URL to redirect to after email verification
    });
    sessionStorage.setItem(`verification-email-sent-${user.uid}`, Date.now().toString());
    logger.log('Verification email resent to:', user.email);
  } catch (error) {
    logger.error('Error resending verification email:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase is not configured. Please check your .env.local file and restart the dev server.');
  }
  
  try {
    await sendPasswordResetEmail(auth, email);
    logger.log('Password reset email sent to:', email);
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw error;
  }
}

/**
 * Link email/password account with Google account
 */
export async function linkGoogleAccount(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase is not configured. Please check your .env.local file and restart the dev server.');
  }
  
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in.');
  }
  
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Link the accounts
    if (result.user.uid !== user.uid) {
      // Accounts are different, try to link them
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        await linkWithCredential(user, credential);
      }
    }
    
    return user;
  } catch (error: any) {
    logger.error('Error linking Google account:', error);
    
    // Handle specific error cases
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('This Google account is already linked to another account.');
    } else if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please sign in with your password first.');
    }
    
    throw error;
  }
}

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): () => void {
  if (!auth) {
    // If Firebase not configured, immediately call callback with null
    // This ensures the auth store knows Firebase is not available
    // Use Promise.resolve to ensure it fires in the next tick but synchronously
    Promise.resolve().then(() => callback(null));
    return () => {};
  }
  
  try {
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    logger.error('Error subscribing to auth state changes:', error);
    // If there's an error, still call callback with null to unblock the UI
    Promise.resolve().then(() => callback(null));
    return () => {};
  }
}



