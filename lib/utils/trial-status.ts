/**
 * Trial Status Utilities
 * 
 * Functions to check trial status and determine access permissions
 */

import { UserProfile } from '@/lib/firebase/user-profile';

/**
 * Check if email belongs to the app owner/administrator
 */
export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const ownerEmails = (process.env.NEXT_PUBLIC_OWNER_EMAILS || 'wherdzik@gmail.com')
    .split(',')
    .map(e => e.trim().toLowerCase());
  return ownerEmails.includes(email.toLowerCase());
}

/**
 * Check if trial is currently active
 */
export function isTrialActive(userProfile: UserProfile | null): boolean {
  if (!userProfile || !userProfile.trialEndDate) {
    return false;
  }

  const now = new Date();
  const trialEndDate = new Date(userProfile.trialEndDate);
  return now < trialEndDate;
}

/**
 * Get number of days remaining in trial (0 if expired)
 */
export function getTrialDaysRemaining(userProfile: UserProfile | null): number {
  if (!userProfile || !userProfile.trialEndDate) {
    return 0;
  }

  const now = new Date();
  const trialEndDate = new Date(userProfile.trialEndDate);
  const diffTime = trialEndDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Check if user has a valid subscription (paid OR active trial OR owner)
 */
export function hasValidSubscription(userProfile: UserProfile | null, userEmail?: string | null): boolean {
  if (!userProfile) {
    return false;
  }

  // Owner/administrator always has access
  if (isOwnerEmail(userEmail || userProfile.email)) {
    return true;
  }

  // Check if user has active paid subscription
  const hasPaidSubscription = 
    userProfile.subscription?.status === 'active' && 
    (userProfile.subscription?.plan === 'pro' || userProfile.subscription?.plan === 'enterprise');

  // If they have paid subscription, they have access
  if (hasPaidSubscription) {
    return true;
  }

  // Otherwise, check if trial is active
  return isTrialActive(userProfile);
}

/**
 * Check if access should be blocked (trial expired AND no paid subscription)
 */
export function shouldBlockAccess(userProfile: UserProfile | null, userEmail?: string | null): boolean {
  if (!userProfile) {
    return false; // Don't block if no profile (will be handled by auth check)
  }

  // Owner/administrator never blocked
  if (isOwnerEmail(userEmail || userProfile.email)) {
    return false;
  }

  // If user has paid subscription, never block
  const hasPaidSubscription = 
    userProfile.subscription?.status === 'active' && 
    (userProfile.subscription?.plan === 'pro' || userProfile.subscription?.plan === 'enterprise');

  if (hasPaidSubscription) {
    return false;
  }

  // Block if trial expired
  return !isTrialActive(userProfile);
}

/**
 * Get days since trial expired (0 if not expired)
 */
export function getDaysSinceTrialExpired(userProfile: UserProfile | null): number {
  if (!userProfile || !userProfile.trialEndDate) {
    return 0;
  }

  const now = new Date();
  const trialEndDate = new Date(userProfile.trialEndDate);
  
  if (now < trialEndDate) {
    return 0; // Trial not expired
  }

  const diffTime = now.getTime() - trialEndDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}
