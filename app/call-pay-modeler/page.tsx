'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ContextCard } from '@/components/call-pay/context-card';
import { TierCard } from '@/components/call-pay/tier-card';
import { ImpactSummary } from '@/components/call-pay/impact-summary';
import { TierManager } from '@/components/call-pay/tier-manager';
import { UsageGuide } from '@/components/call-pay/usage-guide';
import { WelcomeWalkthrough } from '@/components/call-pay/welcome-walkthrough';
import { StepGuide } from '@/components/call-pay/step-guide';
import { CallTierInfo } from '@/components/call-pay/call-tier-info';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  CallPayContext,
  CallTier,
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

  // Determine step completion for accordion state
  const step1Complete = 
    context.specialty !== '' && 
    context.providersOnCall > 0 && 
    context.rotationRatio > 0;

  const enabledTiers = tiers.filter(t => t.enabled);
  const step2Complete = enabledTiers.length > 0 && 
    enabledTiers.some(tier => 
      tier.rates.weekday > 0 && 
      (tier.burden.weekdayCallsPerMonth > 0 || tier.burden.weekendCallsPerMonth > 0)
    );

  // Initialize accordion state based on step completion
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    if (!step1Complete) return ['context'];
    if (!step2Complete) return ['context', 'tiers'];
    return ['context', 'tiers', 'impact'];
  });

  // Update expanded sections when steps complete
  useEffect(() => {
    if (step1Complete && !expandedSections.includes('context')) {
      setExpandedSections(prev => [...prev, 'context']);
    }
    if (step2Complete && !expandedSections.includes('tiers')) {
      setExpandedSections(prev => [...prev, 'tiers']);
    }
    if (step2Complete && !expandedSections.includes('impact')) {
      setExpandedSections(prev => [...prev, 'impact']);
    }
  }, [step1Complete, step2Complete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to expand section and scroll to it
  const expandAndScrollTo = (sectionId: string, elementId: string) => {
    // Expand the section
    if (!expandedSections.includes(sectionId)) {
      setExpandedSections(prev => [...prev, sectionId]);
    }
    // Scroll to element after a brief delay to allow expansion
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Map element IDs to section values for accordion
  const elementIdToSection: Record<string, string> = {
    'context-card': 'context',
    'tier-card': 'tiers',
    'impact-summary': 'impact',
  };

  const handleWalkthroughNavigate = (stepIndex: number, elementId: string) => {
    const sectionValue = elementIdToSection[elementId];
    if (sectionValue) {
      expandAndScrollTo(sectionValue, elementId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 space-y-6 pb-24 md:pb-6">
      {/* Welcome Walkthrough */}
      <WelcomeWalkthrough onNavigateToStep={handleWalkthroughNavigate} />

      {/* Step-by-Step Guide - Sticky */}
      <StepGuide 
        context={context} 
        tiers={tiers}
        onStepClick={(index) => {
          const sections = ['context', 'tiers', 'impact'];
          const elementIds = ['context-card', 'tier-card', 'impact-summary'];
          if (sections[index] && elementIds[index]) {
            expandAndScrollTo(sections[index], elementIds[index]);
          }
        }}
      />

      {/* Accordion for all sections */}
      <Accordion 
        type="multiple" 
        value={expandedSections} 
        onValueChange={(value) => {
          if (Array.isArray(value)) {
            setExpandedSections(value);
          }
        }}
        className="space-y-4"
      >
        {/* Context Card - Step 1 */}
        <div id="context-card" className="scroll-mt-4">
          <AccordionItem value="context">
            <AccordionTrigger className="text-left min-h-[60px] sm:min-h-[64px] touch-manipulation">
              <div className="flex-1 text-left">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
                  Step 1: Set Your Context
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-normal">
                  Enter specialty, providers, and rotation ratio
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0">
              <div className="px-4 pb-4">
                <ContextCard context={context} onContextChange={setContext} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Tiered Call Categories - Step 2 */}
        <div id="tier-card" className="scroll-mt-4">
          <AccordionItem value="tiers">
            <AccordionTrigger className="text-left min-h-[60px] sm:min-h-[64px] touch-manipulation">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    Step 2: Tiered Call Categories
                  </h3>
                  <CallTierInfo />
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-normal">
                  Enable tiers and enter rates & call burden
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0">
              <div className="px-4 pb-4">
                <Card>
                  <CardHeader className="pb-4">
                    <TierManager
                      tiers={tiers}
                      onTiersChange={handleTiersChange}
                      onCreateTier={() => createDefaultTier('', '')}
                    />
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
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* Impact Summary - Step 3 */}
        <div id="impact-summary" className="scroll-mt-4">
          <AccordionItem value="impact">
            <AccordionTrigger className="text-left min-h-[60px] sm:min-h-[64px] touch-manipulation">
              <div className="flex-1 text-left">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-0.5">
                  Step 3: Review Your Budget
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-normal">
                  Check your annual call pay budget
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0">
              <div className="px-4 pb-4">
                <ImpactSummary 
                  impact={impact} 
                  onAddToTCC={handleAddToTCC}
                  annualAllowableBudget={annualAllowableBudget}
                  onBudgetChange={setAnnualAllowableBudget}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>
      </Accordion>
    </div>
  );
}
