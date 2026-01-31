import { UserProfile } from '@/lib/firebase/user-profile';
import { isOwnerEmail, isTrialActive } from '@/lib/utils/trial-status';

export type Entitlement = 'anonymous' | 'owner' | 'pro' | 'trial' | 'expired';

/**
 * Single source of truth for what the user is entitled to do.
 *
 * Business rule (per plan):
 * - Owner: always full access
 * - Pro/Enterprise: paid access
 * - Trial: access during trial window
 * - Expired: trial ended and not paid
 * - Anonymous: not signed in / no profile
 */
export function getEntitlement(userProfile: UserProfile | null, userEmail?: string | null): Entitlement {
  if (!userProfile) return 'anonymous';

  if (isOwnerEmail(userEmail || userProfile.email)) return 'owner';

  const plan = userProfile.subscription?.plan;
  const status = userProfile.subscription?.status;
  const hasPaidAccess = status === 'active' && (plan === 'pro' || plan === 'enterprise');
  if (hasPaidAccess) return 'pro';

  if (isTrialActive(userProfile)) return 'trial';

  return 'expired';
}

export function isPaidEntitlement(entitlement: Entitlement): boolean {
  return entitlement === 'owner' || entitlement === 'pro';
}


