'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MigrationPrompt } from '@/components/auth/migration-prompt';
import { useAuthStore } from '@/lib/store/auth-store';
import { hasMigrated } from '@/lib/firebase/migrateToFirebase';
import { Calculator, TrendingUp, Phone, BarChart3, ClipboardList, ArrowRightLeft, Users } from 'lucide-react';
import { FeedbackButton } from '@/components/feedback/feedback-button';
import { useTrialStatus } from '@/hooks/use-trial-status';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dispatchUpgradeRequired } from '@/lib/utils/upgrade-required';

// Memoized card component to prevent unnecessary re-renders
const ToolCard = memo(({
  href,
  icon: Icon,
  title,
  description,
  shouldBlockNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }>;
  title: string;
  description: string;
  shouldBlockNavigate?: () => boolean;
}) => (
  <Link
    href={href}
    onClick={(e) => {
      // Soft gating: let user see dashboard, but gate locked tools when trial is expired.
      // RouteGuard listens to this event and opens the upgrade modal.
      if (shouldBlockNavigate?.()) {
        e.preventDefault();
        dispatchUpgradeRequired({ href, reason: 'trial_expired' });
      }
    }}
  >
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full group">
      <CardHeader className="space-y-4">
        <div className="w-16 h-16 flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" strokeWidth={2} />
        </div>
        <div>
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  </Link>
));

ToolCard.displayName = 'ToolCard';

export default function HomeClient() {
  const user = useAuthStore((state) => state.user);
  const { needsUpgrade } = useTrialStatus();
  const [showMigration, setShowMigration] = useState(false);

  // Keep a ref so ToolCard can check without forcing all cards to re-render.
  const needsUpgradeRef = useRef(false);
  useEffect(() => {
    needsUpgradeRef.current = !!(user && needsUpgrade);
  }, [user, needsUpgrade]);

  const shouldBlockNavigate = useCallback(() => needsUpgradeRef.current, []);

  useEffect(() => {
    // Show migration prompt if user is logged in and hasn't migrated
    if (user && !hasMigrated()) {
      setShowMigration(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pb-6 sm:pb-8 md:pb-12">
        {/* Migration Prompt */}
        {showMigration && (
          <div className="mb-6">
            <MigrationPrompt onComplete={() => setShowMigration(false)} />
          </div>
        )}

        {/* Professional trial-expired banner (soft gate) */}
        {user && needsUpgrade && (
          <div className="pt-20 sm:pt-24 md:pt-28 safe-area-inset-top">
            <div className="mb-6 rounded-2xl border border-red-200/70 dark:border-red-800/60 bg-red-50/70 dark:bg-red-950/25 px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                      Trial expired — upgrade to keep using premium tools
                    </p>
                    <p className="text-xs text-red-800/90 dark:text-red-300/90">
                      You can still view the dashboard. Locked tools will prompt you to upgrade.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('complens:upgrade-required'));
                      }
                    }}
                  >
                    Upgrade
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300/60 dark:border-red-800/60"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/pricing';
                      }
                    }}
                  >
                    View pricing
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CompLens Branding Title */}
        <div className={user && needsUpgrade ? "text-center mb-12 sm:mb-16" : "text-center mb-12 sm:mb-16 pt-20 sm:pt-24 md:pt-28 safe-area-inset-top"}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-2 flex items-baseline justify-center gap-0.5">
            <span className="text-gray-900 dark:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">Comp</span>
            <span className="text-purple-600 dark:text-purple-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]">Lens</span>
            <sup className="text-xs font-normal text-gray-900 dark:text-white opacity-90 ml-0.5">™</sup>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-light tracking-wide">
            Provider Compensation Intelligence
          </p>
        </div>

        {/* Tools Grid - Primary navigation */}
        <div className="mb-8 sm:mb-10 space-y-10 sm:space-y-12" data-tour="home-tools">
          {/* Productivity & RVU Tools Section */}
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Productivity & RVU Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <ToolCard
                href="/wrvu-modeler"
                icon={Calculator}
                title="Productivity Incentive Calculator"
                description="Calculate bonus pay based on how many patients you see. Perfect for reviewing productivity-based contracts."
                shouldBlockNavigate={shouldBlockNavigate}
              />
              <ToolCard
                href="/wrvu-forecaster"
                icon={BarChart3}
                title="Schedule-Based Productivity Calculator"
                description="See how your schedule translates to pay. Enter shifts and patient visits to forecast annual compensation."
                shouldBlockNavigate={shouldBlockNavigate}
              />
              <ToolCard
                href="/provider-wrvu-tracking"
                icon={ClipboardList}
                title="Provider Work RVU Tracking"
                description="Track your daily patients and work RVUs by month. Perfect for reconciling with compensation reports."
                shouldBlockNavigate={shouldBlockNavigate}
              />
            </div>
          </div>

          {/* Market Analysis & Planning Section */}
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Market Analysis & Planning
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <ToolCard
                href="/fmv-calculator"
                icon={TrendingUp}
                title="FMV Calculator"
                description="Check if an offer is fair by comparing to market data. Use before signing contracts or making offers."
                shouldBlockNavigate={shouldBlockNavigate}
              />
              <ToolCard
                href="/physician-scenarios"
                icon={ArrowRightLeft}
                title="CF Modelling"
                description="Model conversion factors and productivity levels. Enter market data, select a CF model, and see how wRVU percentiles align with TCC percentiles."
                shouldBlockNavigate={shouldBlockNavigate}
              />
              <ToolCard
                href="/provider-comparison"
                icon={Users}
                title="Provider Comparison"
                description="Quickly compare two providers side-by-side with different pay, CF models, and productivity levels to see how they calculate incentives and total cash compensation."
                shouldBlockNavigate={shouldBlockNavigate}
              />
              <ToolCard
                href="/call-pay-modeler"
                icon={Phone}
                title="Call Pay Modeler"
                description="Model call pay schedules and calculate total costs. Perfect for planning call coverage compensation."
                shouldBlockNavigate={shouldBlockNavigate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Button - Floating */}
      <FeedbackButton />
    </div>
  );
}

