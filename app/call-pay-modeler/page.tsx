'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContextCard } from '@/components/call-pay/context-card';
import { TierCard } from '@/components/call-pay/tier-card';
import { ImpactSummary } from '@/components/call-pay/impact-summary';
import { TierManager } from '@/components/call-pay/tier-manager';
import { WelcomeWalkthrough } from '@/components/call-pay/welcome-walkthrough';
import { StepIndicator } from '@/components/ui/step-indicator';
import { StepBadge } from '@/components/ui/step-badge';
import { ScreenInfoModal } from '@/components/ui/screen-info-modal';
import { Button } from '@/components/ui/button';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { CallPaySaveButton } from '@/components/call-pay/call-pay-save-button';
import { ProviderScenario } from '@/types';
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
  const [context, setContext] = useState<CallPayContext>(DEFAULT_CONTEXT);
  const [tiers, setTiers] = useState<CallTier[]>(DEFAULT_TIERS);
  const [expandedTier, setExpandedTier] = useState<string>('C1');
  const [annualAllowableBudget, setAnnualAllowableBudget] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);

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
    setActiveStep(1);
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

      {/* Step Indicator - Sticky so it stays visible when scrolling, perfectly aligned with content */}
      <div className="-mx-4 sm:-mx-6 px-4 sm:px-6">
        <StepIndicator
          currentStep={activeStep}
          totalSteps={totalSteps}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          stepNames={stepNames}
          showProgressBar={false}
          sticky={true}
        />
      </div>

      {/* Step 1: Set Context (Only show when on Step 1) */}
      {activeStep === 1 && (
        <div id="context-card" data-tour="call-pay-context" className="space-y-6">
          {/* Header - No container, just spacing */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StepBadge number={1} variant="default" />
              {/* Title removed - header shows page context */}
              <ScreenInfoModal
                title="Set Context - Call Pay Modeler"
                description={`Enter your call pay context information to begin modeling your call coverage structure.

Required Information:
• Specialty: Select your medical specialty
• Providers on Call: Number of providers in the call rotation
• Rotation Ratio: How often each provider takes call

After entering your context, proceed to Configure Tiers to set up your call categories.`}
              />
            </div>
            <Button
              onClick={handleStartOver}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              Start Over
            </Button>
          </div>
          
          {/* Content - No container, just direct content */}
          <div className="space-y-6">
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
                    setActiveStep(3); // Jump to review budget
                  }
                }}
                className="mb-4"
              />
            <ContextCard context={context} onContextChange={setContext} />
          </div>
        </div>
      )}

      {/* Step 2: Configure Tiers (Only show when on Step 2) */}
      {activeStep === 2 && (
        <div id="tier-card" className="space-y-6" data-tour="call-pay-tiers">
          {/* Header - No container */}
          <div className="flex items-center gap-2">
            <StepBadge number={2} variant="default" />
            {/* Title removed - header shows page context */}
            <ScreenInfoModal
                  title="Configure Tiers - Call Pay Modeler"
                  description={`## Overview
Set up your call coverage tiers and enter rates and call burden for each tier. Each tier represents a different level of call coverage responsibility.

## Configuration Options

### Tier Management
• Enable/Disable Toggle: Use the switch next to each tier to enable or disable it
  - Enabled tiers are included in budget calculations
  - Disabled tiers are excluded from calculations but remain saved
  - The label shows Enabled or Disabled based on the toggle state

### Tier Settings
• Tier Name: Customize the tier identifier (e.g., C1, C2, C3)
• Coverage Type: Select from In-house, Restricted home, Unrestricted home, or Backup only
• Payment Method: Choose Daily/shift rate, Hourly rate, Per procedure, or Per wRVU

### Rate Configuration
• Weekday Rate: Base rate for weekday call coverage
• Weekend Rate: Rate for weekend call coverage
• Holiday Rate: Rate for holiday call coverage

### Rate Calculation Options
• Percentage-Based Calculation Toggle: When enabled, weekend and holiday rates are automatically calculated from weekday rate using percentage uplifts
  - Weekend Uplift %: Percentage increase for weekend rates (default: 20%)
  - Holiday Uplift %: Percentage increase for holiday rates (default: 30%)
  - When disabled, enter rates manually for each period

### Additional Options
• Trauma/High-Acuity Uplift Toggle: Enable to add an additional percentage uplift for high-acuity cases
  - When enabled, enter the uplift percentage
  - Applied to all rates (weekday, weekend, holiday)

### Call Burden
• Enter call volume data for each tier:
  - Calls per month
  - Hours per call
  - Cases per month (for procedural payment methods)

## Understanding Call Tiers

### C1 (First Call)
• Primary on-call coverage with highest frequency
• Immediate response requirements
• Typically highest compensation rate

### C2 (Second Call)
• Backup coverage when C1 is unavailable or needs support
• Lower frequency than C1
• Moderate compensation rate

### C3 (Third Call)
• Tertiary coverage for specialized situations
• Lowest frequency
• Lower compensation rate

### C4, C5
• Additional tiers for further stratification as needed
• Customize based on your call structure

## Next Steps
After configuring your tiers, proceed to Review Budget to see your annual call pay impact.`}
            />
          </div>
          
          {/* Content - No container */}
          <div className="space-y-6">
            <TierManager
              tiers={tiers}
              onTiersChange={handleTiersChange}
              onCreateTier={() => createDefaultTier('', '')}
            />
            
            {/* Segmented Control for Tier Selection */}
            <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
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

            {/* Tier Card - Show selected tier directly without accordion */}
            {tiers
              .filter((tier) => tier.id === expandedTier)
              .map((tier) => (
                <TierCard 
                  key={tier.id}
                  tier={tier} 
                  onTierChange={handleTierChange}
                  specialty={context.specialty as Specialty | undefined}
                />
              ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons - Show when on Step 1 or 2 */}
      {activeStep === 1 && step1Complete && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
          <Button
            onClick={() => setActiveStep(2)}
            className="w-full min-h-[48px] text-base font-semibold"
            size="lg"
          >
            Continue to Configure Tiers →
          </Button>
        </div>
      )}

      {activeStep === 2 && step2Complete && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4 sm:pb-6 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom">
          <Button
            onClick={() => setActiveStep(3)}
            className="w-full min-h-[48px] text-base font-semibold"
            size="lg"
          >
            Continue to Review Budget →
          </Button>
        </div>
      )}

      {/* Step 3: Review Budget (Only shown when on Step 3) */}
      {activeStep === 3 && step2Complete && (
        <div id="impact-summary" className="space-y-6" data-tour="call-pay-budget">
          {/* Header - No container */}
          <div className="flex items-center gap-2">
            <StepBadge number={3} variant="default" />
            {/* Title removed - header shows page context */}
          </div>
          
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
