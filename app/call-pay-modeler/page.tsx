'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { ContextCard } from '@/components/call-pay/context-card';
import { TierCard } from '@/components/call-pay/tier-card';
import { ImpactSummary } from '@/components/call-pay/impact-summary';
import { WelcomeWalkthrough } from '@/components/call-pay/welcome-walkthrough';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { CallPaySaveButton } from '@/components/call-pay/call-pay-save-button';
import { ProviderScenario } from '@/types';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import {
  CallPayContext,
  CallTier,
  Specialty,
} from '@/types/call-pay';
import { calculateCallPayImpact } from '@/lib/utils/call-pay-coverage';
import { cn } from '@/lib/utils/cn';

const DEFAULT_CONTEXT: CallPayContext = {
  specialty: '',
  serviceLine: '',
  providersOnCall: 0,
  rotationRatio: 0,
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
  const { scenarios, loadScenarios } = useScenariosStore();
  const [context, setContext] = useState<CallPayContext>(DEFAULT_CONTEXT);
  const [tiers, setTiers] = useState<CallTier[]>(DEFAULT_TIERS);
  const [expandedTier, setExpandedTier] = useState<string>('C1');
  const [annualAllowableBudget, setAnnualAllowableBudget] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null);
  const [scenarioLoaded, setScenarioLoaded] = useState(false);
  
  const STORAGE_KEY = 'callPayModelerDraftState';

  // Auto-save draft state to localStorage whenever inputs change (debounced, skip when scenario is loaded)
  const draftState = scenarioLoaded ? null : {
    context,
    tiers,
    expandedTier,
    annualAllowableBudget,
    activeStep,
  };
  useDebouncedLocalStorage(STORAGE_KEY, draftState);

  // Load draft state on mount (if no scenario is being loaded via URL)
  useEffect(() => {
    if (typeof window === 'undefined' || scenarioLoaded) return;
    
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        // Only load draft if it has meaningful data
        if (draft.context && (draft.context.specialty || draft.context.providersOnCall > 0)) {
          setContext(draft.context || DEFAULT_CONTEXT);
          setTiers(draft.tiers || DEFAULT_TIERS);
          setExpandedTier(draft.expandedTier || 'C1');
          setAnnualAllowableBudget(draft.annualAllowableBudget || null);
          setActiveStep(draft.activeStep || 1);
        }
      }
    } catch (error) {
      console.error('Error loading draft state:', error);
    }
  }, [scenarioLoaded]);
  
  // Load scenarios on mount
  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);
  
  // Check if there are call-pay scenarios to show border above Context
  const hasCallPayScenarios = useMemo(() => {
    return scenarios.some(s => s.scenarioType === 'call-pay');
  }, [scenarios]);

  // Initialize first tier as enabled by default on mount
  useEffect(() => {
    const hasEnabledTier = tiers.some(t => t.enabled);
    if (!hasEnabledTier && tiers.length > 0) {
      const updatedTiers = tiers.map((t, idx) => 
        idx === 0 ? { ...t, enabled: true } : t
      );
      setTiers(updatedTiers);
    }
    // Only run on mount to initialize, tiers dependency intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Determine step completion
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


  const handleStepClick = (step: number) => {
    // Always allow going back to step 1
    if (step === 1) {
      setActiveStep(1);
      return;
    }
    
    // Allow going to step 2 if step 1 is complete
    if (step === 2 && step1Complete) {
      setActiveStep(2);
      return;
    }
    
  };

  const handleWalkthroughNavigate = (stepIndex: number, elementId: string) => {
    // Map element IDs to step numbers
    const elementToStep: Record<string, number> = {
      'context-card': 1,
      'tier-card': 2,
      'impact-summary': 3,
    };
    const targetStep = elementToStep[elementId];
    if (targetStep) {
      setActiveStep(targetStep);
      // Scroll to top after a brief delay
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleStartOver = () => {
    // Reset context to empty defaults
    setContext({
      specialty: '',
      serviceLine: '',
      providersOnCall: 0,
      rotationRatio: 0,
      modelYear: new Date().getFullYear(),
    });
    // Reset tiers to default empty tiers
    setTiers(DEFAULT_TIERS.map(t => ({ ...t, enabled: false })));
    // Reset other state
    setExpandedTier('C1');
    setAnnualAllowableBudget(null);
    setCurrentScenarioId(null); // Clear current scenario
    setActiveStep(1);
    setScenarioLoaded(false); // Reset scenario loaded flag
    // Clear draft state
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalSteps = 3;
  const stepNames = ['Set Context', 'Configure Tiers', 'Review Budget'];
  const completedSteps = step2Complete ? [1, 2] : step1Complete ? [1] : [];

  return (
    <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8">
      {/* Welcome Walkthrough */}
      <WelcomeWalkthrough onNavigateToStep={handleWalkthroughNavigate} />

      {/* Step 1: Set Context (Only show when on Step 1) */}
      {activeStep === 1 && (
        <div id="context-card" data-tour="call-pay-context" className="space-y-4">
          {/* Content - No container, just direct content */}
          <div className="space-y-4">
            <ContextCard 
              context={context} 
              onContextChange={setContext}
              showTopBorder={false}
              headerAction={
                <ScenarioLoader
                  scenarioType="call-pay"
                  onLoad={(scenario: ProviderScenario) => {
                    // Restore call-pay scenario data
                    if (scenario.callPayData) {
                      const callPayData = scenario.callPayData;
                      setContext(callPayData.context);
                      // Merge loaded tiers with existing tiers structure
                      // Preserve tier IDs and structure
                      const loadedTierIds = new Set(callPayData.tiers.map(t => t.id));
                      const mergedTiers = tiers.map(t => {
                        const loadedTier = callPayData.tiers.find(lt => lt.id === t.id);
                        return loadedTier || t;
                      });
                      // Add any new tiers that weren't in the default structure
                      callPayData.tiers.forEach(loadedTier => {
                        if (!mergedTiers.some(t => t.id === loadedTier.id)) {
                          mergedTiers.push(loadedTier);
                        }
                      });
                      setTiers(mergedTiers);
                      if (callPayData.tiers.length > 0) {
                        setExpandedTier(callPayData.tiers[0].id);
                      }
                      setCurrentScenarioId(scenario.id); // Track loaded scenario
                      setActiveStep(3); // Jump to review budget
                      setScenarioLoaded(true); // Mark scenario as loaded to prevent auto-save overwrite
                    }
                  }}
                />
              }
            />
          </div>
        </div>
      )}

      {/* Step 2: Configure Tiers (Only show when on Step 2) */}
      {activeStep === 2 && (
        <div id="tier-card" className="space-y-6" data-tour="call-pay-tiers">
          {/* Back button in Step 2 to return to Step 1 */}
          <div className="flex items-center gap-2 mb-4">
            <BackButton onClick={() => setActiveStep(1)} aria-label="Back to Set Context" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Back to Set Context</span>
          </div>
          {/* Content - No container */}
          <div className="space-y-6">
            {/* Segmented Control for Tier Selection with Add/Remove buttons */}
            <div className="space-y-3">
              {/* Tier buttons - wrap to multiple lines */}
              <div className="flex flex-wrap gap-2">
                {tiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setExpandedTier(tier.id)}
                    className={cn(
                      'px-4 py-3 rounded-lg font-semibold text-sm whitespace-nowrap',
                      'transition-all duration-150',
                      'min-w-[48px] min-h-[44px] touch-manipulation',
                      expandedTier === tier.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    {tier.name}
                  </button>
                ))}
              </div>
              
              {/* Add Tier and Remove Last buttons - Always on their own row */}
              <div className="flex items-center gap-2">
                {tiers.length < 10 && (
                  <button
                    onClick={() => {
                      const nextNumber = tiers.length + 1;
                      const newTier = createDefaultTier(`C${nextNumber}`, `C${nextNumber}`);
                      handleTiersChange([...tiers, newTier]);
                    }}
                    className={cn(
                      "inline-flex items-center justify-center",
                      "px-2.5 sm:px-3.5 py-2.5 rounded-lg",
                      "text-sm font-medium",
                      "bg-white dark:bg-gray-800",
                      "border border-gray-200 dark:border-gray-700",
                      "text-gray-700 dark:text-gray-300",
                      "hover:bg-gray-50 dark:hover:bg-gray-700",
                      "active:bg-gray-100 dark:active:bg-gray-600",
                      "transition-all duration-150",
                      "shadow-sm hover:shadow",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                      "min-h-[44px] min-w-[44px] sm:min-w-auto touch-manipulation"
                    )}
                    aria-label="Add tier"
                  >
                    <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline ml-1.5">Add Tier</span>
                  </button>
                )}
                {tiers.length > 1 && (
                  <button
                    onClick={() => {
                      if (tiers.length <= 1) return;
                      const updatedTiers = tiers.filter((t) => t.id !== tiers[tiers.length - 1].id);
                      handleTiersChange(updatedTiers);
                    }}
                    className={cn(
                      "inline-flex items-center justify-center",
                      "px-2.5 sm:px-3.5 py-2.5 rounded-lg",
                      "text-sm font-medium",
                      "bg-white dark:bg-gray-800",
                      "border border-red-200 dark:border-red-800/50",
                      "text-red-600 dark:text-red-400",
                      "hover:bg-red-50 dark:hover:bg-red-900/20",
                      "active:bg-red-100 dark:active:bg-red-900/30",
                      "transition-all duration-150",
                      "shadow-sm hover:shadow",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1",
                      "min-h-[44px] min-w-[44px] sm:min-w-auto touch-manipulation"
                    )}
                    aria-label="Remove last tier"
                  >
                    <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline ml-1.5">Remove Last</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tier Card - Show selected tier directly without accordion */}
            {tiers
              .filter((tier) => tier.id === expandedTier)
              .map((tier) => (
                <TierCard 
                  key={tier.id}
                  tier={tier} 
                  onTierChange={handleTierChange}
                  specialty={context.specialty as Specialty | undefined}
                  context={context}
                />
              ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons - Show when on Step 1 or 2 */}
      {activeStep === 1 && step1Complete && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
          <div className="flex gap-3">
            <Button
              onClick={handleStartOver}
              variant="outline"
              className="flex-1 min-h-[48px] text-base font-semibold"
              size="lg"
            >
              Start Over
            </Button>
            <Button
              onClick={() => setActiveStep(2)}
              className="flex-1 min-h-[48px] text-base font-semibold"
              size="lg"
            >
              Configure Tiers
            </Button>
          </div>
        </div>
      )}

      {activeStep === 2 && step2Complete && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
          <Button
            onClick={() => setActiveStep(3)}
            className="w-full min-h-[48px] text-base font-semibold"
            size="lg"
          >
            Review Budget
          </Button>
        </div>
      )}

      {/* Step 3: Review Budget (Only shown when on Step 3) */}
      {activeStep === 3 && step2Complete && (
        <div id="impact-summary" className="space-y-6" data-tour="call-pay-budget">
          {/* Back button in Step 3 to return to Step 2 */}
          <div className="flex items-center gap-2 mb-4">
            <BackButton onClick={() => setActiveStep(2)} aria-label="Back to Configure Tiers" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Back to Configure Tiers</span>
          </div>
          {/* Header removed - step indicator above provides context */}
          
          {/* Content - No container */}
          <div className="space-y-6">
              <ImpactSummary 
                impact={impact} 
                annualAllowableBudget={annualAllowableBudget}
                onBudgetChange={setAnnualAllowableBudget}
                tiers={tiers}
                context={context}
              />
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <CallPaySaveButton
                  context={context}
                  tiers={tiers}
                  impact={impact}
                  annualAllowableBudget={annualAllowableBudget}
                  currentScenarioId={currentScenarioId}
                />
                <Button
                  variant="outline"
                  onClick={handleStartOver}
                  className="w-full"
                >
                  Start New Calculation
                </Button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
