'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ContextCard } from '@/components/call-pay/context-card';
import { TierCard } from '@/components/call-pay/tier-card';
import { ImpactSummary } from '@/components/call-pay/impact-summary';
import { FMVBenchmarkPanel } from '@/components/call-pay/fmv-benchmark-panel';
import { TierManager } from '@/components/call-pay/tier-manager';
import { UsageGuide } from '@/components/call-pay/usage-guide';
import { WelcomeWalkthrough } from '@/components/call-pay/welcome-walkthrough';
import { StepGuide } from '@/components/call-pay/step-guide';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  CallPayContext,
  CallTier,
  CallPayBenchmarks,
  Specialty,
} from '@/types/call-pay';
import { calculateCallPayImpact } from '@/lib/utils/call-pay-coverage';
import { cn } from '@/lib/utils/cn';

const DEFAULT_CONTEXT: CallPayContext = {
  specialty: 'Cardiology',
  serviceLine: '',
  providersOnCall: 10,
  rotationRatio: 4,
  modelYear: new Date().getFullYear(),
};

function createDefaultTier(id: string, name: string): CallTier {
  return {
    id,
    name,
    coverageType: 'In-house',
    paymentMethod: 'Daily / shift rate',
    rates: {
      weekday: 0,
      weekend: 0,
      holiday: 0,
    },
    burden: {
      weekdayCallsPerMonth: 0,
      weekendCallsPerMonth: 0,
      holidaysPerYear: 0,
      avgCallbacksPer24h: 0,
    },
    enabled: false,
  };
}

// Default to C1-C5, but users can add more tiers dynamically
const DEFAULT_TIERS: CallTier[] = [
  createDefaultTier('C1', 'C1'),
  createDefaultTier('C2', 'C2'),
  createDefaultTier('C3', 'C3'),
  createDefaultTier('C4', 'C4'),
  createDefaultTier('C5', 'C5'),
  // C6 and beyond can be added by users if needed
];

export default function CallPayModelerPage() {
  const router = useRouter();
  const [context, setContext] = useState<CallPayContext>(DEFAULT_CONTEXT);
  const [tiers, setTiers] = useState<CallTier[]>(DEFAULT_TIERS);
  const [benchmarks, setBenchmarks] = useState<CallPayBenchmarks>({});
  const [expandedTier, setExpandedTier] = useState<string>('C1');
  const [annualAllowableBudget, setAnnualAllowableBudget] = useState<number | null>(null);

  // Initialize first tier as enabled by default on mount
  useEffect(() => {
    const hasEnabledTier = tiers.some(t => t.enabled);
    if (!hasEnabledTier && tiers.length > 0) {
      const updatedTiers = tiers.map((t, idx) => 
        idx === 0 ? { ...t, enabled: true } : t
      );
      setTiers(updatedTiers);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate impact
  const impact = useMemo(() => {
    return calculateCallPayImpact(tiers, context);
  }, [tiers, context]);

  // Get average rates for FMV benchmark panel (from enabled tiers)
  const averageRates = useMemo(() => {
    const enabledTiers = tiers.filter((t) => t.enabled);
    if (enabledTiers.length === 0) {
      return { weekday: 0, weekend: 0, holiday: 0 };
    }

    const totals = enabledTiers.reduce(
      (acc, tier) => ({
        weekday: acc.weekday + tier.rates.weekday,
        weekend: acc.weekend + tier.rates.weekend,
        holiday: acc.holiday + tier.rates.holiday,
      }),
      { weekday: 0, weekend: 0, holiday: 0 }
    );

    return {
      weekday: totals.weekday / enabledTiers.length,
      weekend: totals.weekend / enabledTiers.length,
      holiday: totals.holiday / enabledTiers.length,
    };
  }, [tiers]);

  const handleTierChange = (updatedTier: CallTier) => {
    setTiers(tiers.map((t) => (t.id === updatedTier.id ? updatedTier : t)));
  };

  const handleTiersChange = (newTiers: CallTier[]) => {
    setTiers(newTiers);
    // If the currently expanded tier was removed, switch to the first tier
    if (!newTiers.some((t) => t.id === expandedTier) && newTiers.length > 0) {
      setExpandedTier(newTiers[0].id);
    }
  };

  const handleAddToTCC = () => {
    // Navigate to FMV calculator with call pay pre-filled
    const totalCallPay = impact.averageCallPayPerProvider;
    router.push(`/fmv-calculator?callPay=${totalCallPay}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-24 md:pb-6">
      {/* Welcome Walkthrough */}
      <WelcomeWalkthrough />

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Call Pay & Coverage Modeler
          </h2>
          <UsageGuide />
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Model tiered call pay structures for all specialties including primary care,
          procedural, and medical subspecialties
        </p>
      </div>

      {/* Step-by-Step Guide */}
      <StepGuide context={context} tiers={tiers} />

      {/* Annual Budget Input - Set target upfront */}
      <Card className="shadow-sm">
        <CardContent className="p-4 md:p-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Annual Allowable Budget
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set your target budget to track spending as you configure call pay
              </p>
            </div>
            <CurrencyInput
              id="annual-budget"
              value={annualAllowableBudget || undefined}
              onChange={(value) => setAnnualAllowableBudget(value > 0 ? value : null)}
              placeholder="2,000,000"
              className="w-full h-12 text-base touch-manipulation"
              showDecimals={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Context Card - Step 1 */}
      <div id="context-card" className="scroll-mt-4">
        <ContextCard context={context} onContextChange={setContext} />
      </div>

      {/* Tiered Call Categories - Step 2 */}
      <Card id="tier-card" className="scroll-mt-4">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl">Step 2: Tiered Call Categories</CardTitle>
            <TierManager
              tiers={tiers}
              onTiersChange={handleTiersChange}
              onCreateTier={() => createDefaultTier('', '')}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Segmented Control for Tier Selection */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
            {tiers.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setExpandedTier(tier.id)}
                className={cn(
                  'px-4 py-3 rounded-lg font-semibold text-sm whitespace-nowrap',
                  'transition-all duration-150',
                  'min-w-[48px] min-h-[44px] touch-manipulation', // iOS-friendly touch target
                  expandedTier === tier.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {tier.name}
              </button>
            ))}
          </div>

          {/* Accordion for Tiers */}
          <Accordion
            type="single"
            value={expandedTier}
            onValueChange={(value) => {
              if (typeof value === 'string' && value) {
                setExpandedTier(value);
              } else if (Array.isArray(value) && value.length > 0) {
                setExpandedTier(value[0]);
              }
            }}
          >
            {tiers.map((tier) => (
              <AccordionItem key={tier.id} value={tier.id}>
                <AccordionTrigger isOpen={expandedTier === tier.id} value={tier.id}>
                  {tier.name} - {tier.coverageType}
                </AccordionTrigger>
                <AccordionContent isOpen={expandedTier === tier.id}>
                  <TierCard 
                    tier={tier} 
                    onTierChange={handleTierChange}
                    specialty={context.specialty as Specialty | undefined}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Impact Summary - Step 3 - Always show so users can see where budget appears */}
      <div id="impact-summary" className="scroll-mt-4">
        <ImpactSummary 
          impact={impact} 
          onAddToTCC={handleAddToTCC}
          annualAllowableBudget={annualAllowableBudget}
          onBudgetChange={setAnnualAllowableBudget}
        />
      </div>

      {/* FMV Benchmark Panel */}
      <FMVBenchmarkPanel
        weekdayRate={averageRates.weekday}
        weekendRate={averageRates.weekend}
        holidayRate={averageRates.holiday}
        benchmarks={benchmarks}
        onBenchmarksChange={setBenchmarks}
      />
    </div>
  );
}
