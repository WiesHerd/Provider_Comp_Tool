'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X, ArrowRight, Clock } from 'lucide-react';
import { useTrialStatus } from '@/hooks/use-trial-status';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { isOwnerEmail } from '@/lib/utils/trial-status';
import Link from 'next/link';

/**
 * Trial Welcome Banner Component
 * 
 * Friendly, informative banner that appears for new users to inform them about their free trial.
 * Similar to how Notion, Figma, and Linear present trial information - professional and welcoming.
 * 
 * Shows:
 * - Welcome message with trial information
 * - Days remaining in trial
 * - Link to upgrade/pricing
 * - Dismissible (remembers dismissal in localStorage)
 */
export function TrialWelcomeBanner() {
  const { user } = useAuthStore();
  const { isTrialActive, daysRemaining, loading: trialLoading } = useTrialStatus();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [hasSeenBanner, setHasSeenBanner] = useState(false);
  const isOwner = isOwnerEmail(user?.email || null);

  // Check if user has seen the banner before
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    
    const seenKey = `complens-trial-banner-seen-${user.uid}`;
    const hasSeen = localStorage.getItem(seenKey) === 'true';
    setHasSeenBanner(hasSeen);
    
    // Auto-dismiss if user has seen it before
    if (hasSeen) {
      setDismissed(true);
    }
  }, [user]);

  // Don't show banner if:
  // - No user
  // - User is owner/admin (owners don't need trial banner)
  // - Still loading trial status
  // - Trial not active (expired or has paid subscription)
  // - Banner is dismissed
  // - User has seen it before
  if (!user || isOwner || trialLoading || !isTrialActive || dismissed || hasSeenBanner) {
    return null;
  }

  // Don't show on auth or pricing pages
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname === '/auth' || pathname === '/pricing') {
      return null;
    }
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (user && typeof window !== 'undefined') {
      const seenKey = `complens-trial-banner-seen-${user.uid}`;
      localStorage.setItem(seenKey, 'true');
    }
  };

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const trialDays = parseInt(process.env.NEXT_PUBLIC_TRIAL_DAYS || '14', 10);

  return (
    <div 
      className={cn(
        "relative w-full bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50",
        "dark:from-purple-950/30 dark:via-blue-950/30 dark:to-purple-950/30",
        "border-b border-purple-200/50 dark:border-purple-800/50",
        "px-4 sm:px-6 py-4 sm:py-5",
        "animate-in slide-in-from-top duration-500",
        "shadow-sm"
      )}
      role="banner"
      aria-label="Trial information"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-1.5">
                  Welcome! You're on a {trialDays}-day free trial
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  Explore all of CompLens's features for free. You have{' '}
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                  </span>{' '}
                  remaining to try everything. No credit card required.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/pricing">
                    <Button
                      size="sm"
                      className={cn(
                        "bg-purple-600 hover:bg-purple-700 text-white",
                        "shadow-md hover:shadow-lg",
                        "transition-all duration-200"
                      )}
                      onClick={handleUpgrade}
                    >
                      View Plans
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                    </span>
                  </div>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg",
                  "flex items-center justify-center",
                  "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                )}
                aria-label="Dismiss trial banner"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




