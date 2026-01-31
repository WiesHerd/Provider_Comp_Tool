/**
 * User Profile Management
 * 
 * Handles user profile creation and updates in Firestore
 */

'use client';

import { User } from 'firebase/auth';
import { db } from './config';
import { logger } from '@/lib/utils/logger';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  metadata?: {
    signUpMethod?: 'email' | 'google';
    [key: string]: any;
  };
  subscription?: {
    status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
    plan: 'free' | 'pro' | 'enterprise';
    currentPeriodEnd?: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  trialStartDate?: string;
  trialEndDate?: string;
}

/**
 * Create or update user profile in Firestore
 */
export async function createOrUpdateUserProfile(
  user: User,
  metadata?: { signUpMethod?: 'email' | 'google'; [key: string]: any }
): Promise<void> {
  if (!db) {
    logger.warn('Firebase is not configured. User profile will not be saved.');
    return;
  }

  try {
    const profileRef = doc(db, 'users', user.uid);
    const existingProfile = await getDoc(profileRef);

    const now = new Date().toISOString();
    const profileData: Partial<UserProfile> = {
      userId: user.uid,
      email: user.email || '',
      updatedAt: now,
      lastLoginAt: now,
      metadata: {
        ...(existingProfile.exists() ? existingProfile.data()?.metadata : {}),
        ...metadata,
      },
    };
    
    // Only include displayName if it exists (Firestore doesn't allow undefined)
    if (user.displayName) {
      profileData.displayName = user.displayName;
    }

    // Only set createdAt if this is a new profile
    if (!existingProfile.exists()) {
      profileData.createdAt = now;
      
      // Check if user is owner/administrator
      const ownerEmails = (process.env.NEXT_PUBLIC_OWNER_EMAILS || 'wherdzik@gmail.com')
        .split(',')
        .map(e => e.trim().toLowerCase());
      const isOwner = user.email && ownerEmails.includes(user.email.toLowerCase());
      
      if (isOwner) {
        // Owner gets enterprise plan with no trial restrictions
        profileData.subscription = {
          status: 'active',
          plan: 'enterprise',
        };
        logger.log('✅ Creating owner/admin profile - enterprise access granted', {
          userId: user.uid,
          email: user.email
        });
      } else {
        // Set default free subscription for new users
        profileData.subscription = {
          status: 'active',
          plan: 'free',
        };
        // Set trial dates for new users (14 days from now)
        const trialDays = parseInt(process.env.NEXT_PUBLIC_TRIAL_DAYS || '14', 10);
        const trialEndDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
        profileData.trialStartDate = now;
        profileData.trialEndDate = trialEndDate.toISOString();
      }
      logger.log('✅ Creating new user profile in Firestore:', {
        userId: user.uid,
        email: user.email,
        collection: 'users',
        documentId: user.uid
      });
    } else {
      profileData.createdAt = existingProfile.data()?.createdAt || now;
      // Preserve existing subscription or set to free if missing
      const existingData = existingProfile.data();
      if (!existingData?.subscription) {
        profileData.subscription = {
          status: 'active',
          plan: 'free',
        };
      }
      // Check if user is owner/administrator
      const ownerEmails = (process.env.NEXT_PUBLIC_OWNER_EMAILS || 'wherdzik@gmail.com')
        .split(',')
        .map(e => e.trim().toLowerCase());
      const isOwner = user.email && ownerEmails.includes(user.email.toLowerCase());
      
      if (isOwner) {
        // Owner always gets enterprise plan - upgrade if not already set
        if (!existingData?.subscription || existingData.subscription.plan !== 'enterprise') {
          profileData.subscription = {
            status: 'active',
            plan: 'enterprise',
            ...(existingData?.subscription?.stripeCustomerId && { stripeCustomerId: existingData.subscription.stripeCustomerId }),
            ...(existingData?.subscription?.stripeSubscriptionId && { stripeSubscriptionId: existingData.subscription.stripeSubscriptionId }),
          };
          logger.log('✅ Upgrading owner/admin to enterprise plan', {
            userId: user.uid,
            email: user.email
          });
        }
      } else {
        // Migrate existing users: set trial dates if they don't exist OR if trial expired and no paid subscription
        // Give existing users a fresh 14-day trial starting from now (not from their original signup date)
        const hasPaidSubscription = 
          existingData?.subscription?.status === 'active' && 
          (existingData?.subscription?.plan === 'pro' || existingData?.subscription?.plan === 'enterprise');
        
        // IMPORTANT: treat *either* missing trialStartDate OR trialEndDate as needing reset.
        // This protects against older/partial profile documents that might have one date but not the other,
        // which would otherwise incorrectly block access.
        const needsTrialReset = 
          (!existingData?.trialStartDate || !existingData?.trialEndDate) ||
          (existingData?.trialEndDate && 
           new Date(existingData.trialEndDate) < new Date() && 
           !hasPaidSubscription);
        
        if (needsTrialReset) {
          const trialDays = parseInt(process.env.NEXT_PUBLIC_TRIAL_DAYS || '14', 10);
          const trialEndDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
          profileData.trialStartDate = now;
          profileData.trialEndDate = trialEndDate.toISOString();
          logger.log('✅ Migrating/resetting existing user: setting fresh trial dates', {
            userId: user.uid,
            trialStartDate: now,
            trialEndDate: trialEndDate.toISOString(),
            reason: existingData?.trialEndDate ? 'trial expired or incomplete' : 'missing trial dates'
          });
        }
      }
      logger.log('✅ Updating existing user profile in Firestore:', {
        userId: user.uid,
        email: user.email
      });
    }

    await setDoc(profileRef, profileData, { merge: true });
    logger.log('✅ User profile saved successfully to Firestore:', {
      userId: user.uid,
      email: user.email,
      path: `users/${user.uid}`
    });
  } catch (error) {
    logger.error('Error creating/updating user profile:', error);
    // Don't throw - profile creation failure shouldn't block sign-in
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!db) {
    return null;
  }

  try {
    const profileRef = doc(db, 'users', userId);
    const profileDoc = await getDoc(profileRef);

    if (!profileDoc.exists()) {
      return null;
    }

    const data = profileDoc.data();
    return {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      lastLoginAt: data.lastLoginAt,
      metadata: data.metadata,
      subscription: data.subscription,
      trialStartDate: data.trialStartDate,
      trialEndDate: data.trialEndDate,
    } as UserProfile;
  } catch (error) {
    logger.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: string): Promise<void> {
  if (!db) {
    return;
  }

  try {
    const profileRef = doc(db, 'users', userId);
    await setDoc(
      profileRef,
      {
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    logger.error('Error updating last login:', error);
    // Don't throw - this is a non-critical operation
  }
}




