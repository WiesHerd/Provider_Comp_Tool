'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { getUserProfile } from '@/lib/firebase/user-profile';
import { 
  isTrialActive, 
  getTrialDaysRemaining, 
  hasValidSubscription, 
  shouldBlockAccess 
} from '@/lib/utils/trial-status';
import { UserProfile } from '@/lib/firebase/user-profile';
import { getEntitlement } from '@/lib/utils/entitlements';

export function useTrialStatus() {
  const { user } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const userEmail = user?.email || null;
  const isActive = isTrialActive(userProfile);
  const daysRemaining = getTrialDaysRemaining(userProfile);
  const hasValid = hasValidSubscription(userProfile, userEmail);
  const needsUpgrade = shouldBlockAccess(userProfile, userEmail);
  const entitlement = getEntitlement(userProfile, userEmail);

  return {
    userProfile,
    isTrialActive: isActive,
    daysRemaining,
    hasValidSubscription: hasValid,
    needsUpgrade,
    entitlement,
    loading,
    refreshProfile,
  };
}
