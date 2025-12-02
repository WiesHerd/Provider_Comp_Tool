'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { ContextCard } from '@/components/call-pay/context-card';
import { TierCard } from '@/components/call-pay/tier-card';
import { ImpactSummary } from '@/components/call-pay/impact-summary';
import { ProviderRoster } from '@/components/call-pay/provider-roster';
import { BurdenFairnessPanel } from '@/components/call-pay/burden-fairness-panel';
import { FMVPanel } from '@/components/call-pay/fmv-panel';
import { ScenarioComparisonTable } from '@/components/call-pay/scenario-comparison-table';
import { ExecutiveReportExport } from '@/components/call-pay/executive-report-export';
import { useCallPayScenariosStore } from '@/lib/store/call-pay-scenarios-store';
import { hydrateStateFromScenario } from '@/lib/utils/call-pay-scenario-utils';
import { useProgramCatalogStore } from '@/lib/store/program-catalog-store';
import { useUserPreferencesStore } from '@/lib/store/user-preferences-store';
import { mapCatalogProgramToContext, getDefaultAssumptionsFromProgram } from '@/lib/utils/program-catalog-adapter';
import { mapCallPayStateToEngineInputs } from '@/lib/utils/call-pay-adapter';
import { calculateCallBudget } from '@/lib/utils/call-pay-engine';
import { calculateExpectedBurden, calculateFairnessMetrics } from '@/lib/utils/burden-calculations';
import { generateCallSchedule } from '@/lib/utils/call-schedule-generator';
import { generateTestSchedule } from '@/lib/utils/generate-test-schedule';
import { CallSchedule } from '@/types/call-schedule';
import { WelcomeWalkthrough } from '@/components/call-pay/welcome-walkthrough';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Info, DollarSign, Scale, ChevronLeft, RotateCcw } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { ScenarioLoader } from '@/components/scenarios/scenario-loader';
import { CallPaySaveButton } from '@/components/call-pay/call-pay-save-button';
import { FMVOverrideTracker } from '@/components/call-pay/fmv-override-tracker';
import { ComplianceExport } from '@/components/call-pay/compliance-export';
import { FMVBenchmarkPanel } from '@/components/call-pay/fmv-benchmark-panel';
import { ProgramSelector } from '@/components/call-pay/program-selector';
import { useScenariosStore } from '@/lib/store/scenarios-store';
import {
  CallPayContext,
  CallTier,
  Specialty,
  ComplianceMetadata,
  CallPayBenchmarks,
} from '@/types/call-pay';
import { CallProvider, CallAssumptions } from '@/types/call-pay-engine';
import { calculateCallPayImpact } from '@/lib/utils/call-pay-coverage';
import { cn } from '@/lib/utils/cn';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AutoHideSticky } from '@/components/ui/auto-hide-sticky';

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

/**
 * Apply program assumptions to tiers if burden values are empty/default
 * Only applies to first enabled tier, or first tier if none enabled
 * Preserves existing manual edits
 */
function applyProgramAssumptionsToTiers(
  tiers: CallTier[],
  assumptions: CallAssumptions
): CallTier[] {
  // Find first enabled tier, or first tier if none enabled
  const firstEnabledTier = tiers.find(t => t.enabled);
  const targetTier = firstEnabledTier || tiers[0];
  
  if (!targetTier) {
    return tiers; // No tiers to update
  }
  
  // Check if burden values are empty/default (all zeros)
  const isBurdenEmpty = 
    targetTier.burden.weekdayCallsPerMonth === 0 &&
    targetTier.burden.weekendCallsPerMonth === 0 &&
    targetTier.burden.holidaysPerYear === 0;
  
  // Only apply if burden is empty (preserve manual edits)
  if (!isBurdenEmpty) {
    return tiers;
  }
  
  // Apply assumptions to the target tier
  return tiers.map(tier => 
    tier.id === targetTier.id
      ? {
          ...tier,
          burden: {
            ...tier.burden,
            weekdayCallsPerMonth: assumptions.weekdayCallsPerMonth,
            weekendCallsPerMonth: assumptions.weekendCallsPerMonth,
            holidaysPerYear: assumptions.holidaysPerYear,
            // Keep avgCallbacksPer24h as is (not in assumptions)
          },
        }
      : tier
  );
}

export default function CallPayModelerPage() {
  const { loadScenarios } = useScenariosStore();
  const { scenarios, getComparisonData, getScenario, setActiveScenario, loadScenarios: loadCallPayScenarios, activeScenarioId } = useCallPayScenariosStore();
  const { getProgram, loadInitialData: loadProgramCatalog } = useProgramCatalogStore();
  const { modelingMode, setModelingMode, activeProgramId, loadPreferences } = useUserPreferencesStore();
  
  // Helper to get active program
  const getActiveProgram = () => {
    if (!activeProgramId) return null;
    return getProgram(activeProgramId) || null;
  };
  const [context, setContext] = useState<CallPayContext>(DEFAULT_CONTEXT);
  const [tiers, setTiers] = useState<CallTier[]>(DEFAULT_TIERS);
  const [expandedTier, setExpandedTier] = useState<string>('C1');
  const [annualAllowableBudget, setAnnualAllowableBudget] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'setup' | 'configuration' | 'fmv-benchmarking' | 'results'>('setup');
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null);
  const [scenarioLoaded, setScenarioLoaded] = useState(false);
  const [benchmarks, setBenchmarks] = useState<CallPayBenchmarks>({});
  const [complianceMetadata, setComplianceMetadata] = useState<ComplianceMetadata>({
    fmvOverrides: [],
    auditLog: [],
  });
  const [providerRoster, setProviderRoster] = useState<CallProvider[]>([]);
  const [budgetReviewTab, setBudgetReviewTab] = useState<'cost' | 'burden'>('cost');
  const [enableFMVBenchmarks, setEnableFMVBenchmarks] = useState<boolean>(false);
  const [callSchedule, setCallSchedule] = useState<CallSchedule | null>(null);
  
  const STORAGE_KEY = 'callPayModelerDraftState';

  // Auto-save draft state to localStorage whenever inputs change (debounced, skip when scenario is loaded)
  const draftState = scenarioLoaded ? null : {
    context,
    tiers,
    expandedTier,
    annualAllowableBudget,
    activeStep,
    providerRoster,
    enableFMVBenchmarks,
    callSchedule,
    modelingMode,
  };
  useDebouncedLocalStorage(STORAGE_KEY, draftState);

  // Load user preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Load call pay scenarios on mount
  useEffect(() => {
    loadCallPayScenarios();
  }, [loadCallPayScenarios]);

  // Load program catalog on mount
  useEffect(() => {
    loadProgramCatalog();
  }, [loadProgramCatalog]);

  // Auto-switch to Quick Mode if Advanced Mode is selected but no program is active
  useEffect(() => {
    if (modelingMode === "advanced" && !getActiveProgram()) {
      setModelingMode("quick");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProgramId, modelingMode, setModelingMode]);

  // Switch to Cost tab when switching from Advanced to Quick Mode
  useEffect(() => {
    if (modelingMode === "quick" && budgetReviewTab === 'burden') {
      setBudgetReviewTab('cost');
    }
  }, [modelingMode, budgetReviewTab]);

  // Initialize from active program if available
  useEffect(() => {
    const activeProgram = getActiveProgram();
    if (activeProgram && !scenarioLoaded) {
      // Pre-populate context from active program
      const programContext = mapCatalogProgramToContext(
        activeProgram,
        context.providersOnCall || 0,
        context.rotationRatio || 4
      );
      // Only update if context is empty or matches default
      if (context.specialty === '' || context.specialty === DEFAULT_CONTEXT.specialty) {
        setContext(programContext);
      }
      
      // Apply default assumptions to tiers if burden is empty
      const assumptions = getDefaultAssumptionsFromProgram(activeProgram);
      setTiers(prevTiers => applyProgramAssumptionsToTiers(prevTiers, assumptions));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProgramId, scenarioLoaded, context.specialty]); // Re-run when active program changes

  // Handle scenario loading
  const handleLoadScenario = (scenarioId: string) => {
    const scenario = getScenario(scenarioId);
    if (!scenario) return;

    const hydrated = hydrateStateFromScenario(scenario);
    setContext(hydrated.context);
    setTiers(hydrated.tiers);
    setProviderRoster(hydrated.providers);
    setScenarioLoaded(true);
    setCurrentScenarioId(scenarioId);
    setActiveScenario(scenarioId);
  };

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
          setProviderRoster(draft.providerRoster || []);
          setEnableFMVBenchmarks(draft.enableFMVBenchmarks ?? false);
          // Note: modelingMode is now managed by user preferences store
          // Load test schedule if available, or generate one for demo
          if (draft.callSchedule) {
            setCallSchedule(draft.callSchedule);
          } else if (typeof window !== 'undefined' && window.location.search.includes('test=true')) {
            // Auto-load test data if ?test=true in URL
            const testSchedule = generateTestSchedule(draft.context?.modelYear || new Date().getFullYear());
            setCallSchedule(testSchedule);
          }
          // Only restore activeStep if it's valid (1-4), otherwise default to 1
          const savedStep = draft.activeStep || 1;
          setActiveStep(savedStep >= 1 && savedStep <= 4 ? savedStep : 1);
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

  // Auto-generate provider roster when providersOnCall changes
  useEffect(() => {
    const targetCount = context.providersOnCall;
    const currentCount = providerRoster.length;
    const firstEnabledTier = tiers.find(t => t.enabled) || tiers[0];
    const defaultTierId = firstEnabledTier?.id || 'C1';

    if (targetCount > currentCount) {
      // Add new providers
      const newProviders: CallProvider[] = Array.from({ length: targetCount - currentCount }, (_, i) => ({
        id: `provider-${currentCount + i + 1}`,
        name: `Provider ${currentCount + i + 1}`,
        fte: 1.0,
        tierId: defaultTierId,
        eligibleForCall: true,
      }));
      setProviderRoster([...providerRoster, ...newProviders]);
    } else if (targetCount < currentCount) {
      // Remove excess providers (keep first N)
      setProviderRoster(providerRoster.slice(0, targetCount));
    } else if (targetCount === 0) {
      // Clear roster if providersOnCall is 0
      setProviderRoster([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.providersOnCall]);

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

  // Auto-reset logic for steps
  useEffect(() => {
    if (activeStep === 3 && !step2Complete) {
      setActiveStep(2);
    }
    if (activeStep === 4 && !step2Complete) {
      setActiveStep(2);
    }
  }, [activeStep, step2Complete]);

  const handleWalkthroughNavigate = (_stepIndex: number, elementId: string) => {
    // Map element IDs to tabs
    const elementToTab: Record<string, 'setup' | 'configuration' | 'fmv-benchmarking' | 'results'> = {
      'context-card': 'setup',
      'tier-card': 'configuration',
      'fmv-benchmarking': 'fmv-benchmarking',
      'impact-summary': 'results',
    };
    const targetTab = elementToTab[elementId];
    if (targetTab) {
      setActiveTab(targetTab);
      // Map tabs to steps
      if (targetTab === 'setup') setActiveStep(1);
      else if (targetTab === 'configuration') setActiveStep(2);
      else if (targetTab === 'fmv-benchmarking') setActiveStep(3);
      else if (targetTab === 'results') setActiveStep(4);
      // Scroll to top after a brief delay
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };
  
  // Sync activeTab with activeStep when step changes externally
  useEffect(() => {
    if (activeStep === 1) setActiveTab('setup');
    else if (activeStep === 2) setActiveTab('configuration');
    else if (activeStep === 3) setActiveTab('fmv-benchmarking');
    else if (activeStep === 4) setActiveTab('results');
  }, [activeStep]);

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

  const comparisonData = useMemo(() => getComparisonData(), [getComparisonData]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full px-4 sm:px-6 lg:max-w-4xl lg:mx-auto pt-6 sm:pt-8 md:pt-10 pb-4 sm:pb-6 md:pb-8">
      {/* Scenario Comparison Table - Show when there are multiple scenarios */}
      {comparisonData.length > 1 && (
        <div className="mb-6 space-y-4">
          <ScenarioComparisonTable
            comparisons={comparisonData}
            onSelectScenario={handleLoadScenario}
          />
          <div className="flex justify-end">
            <ExecutiveReportExport
              comparisonMode={true}
              selectedScenarioIds={scenarios.map(s => s.id)}
              className="min-h-[44px] touch-target"
            />
          </div>
        </div>
      )}

      {/* Page Header - Clean Apple-style */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Call Pay Modeler
            </h1>
            <Tooltip 
              content="Model call pay schedules and calculate total costs. Perfect for planning call coverage compensation."
              side="right"
            >
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
            </Tooltip>
          </div>
          <ScenarioLoader
            scenarioType="call-pay"
            onLoad={(providerScenario) => {
              // Try to load from CallScenario format first
              const callPayScenario = getScenario(providerScenario.id);
              if (callPayScenario) {
                handleLoadScenario(callPayScenario.id);
              } else if (providerScenario.callPayData) {
                // Fallback: load from ProviderScenario format
                setContext(providerScenario.callPayData.context);
                setTiers(providerScenario.callPayData.tiers);
                setScenarioLoaded(true);
                setCurrentScenarioId(providerScenario.id);
                setActiveScenario(providerScenario.id);
              }
            }}
          />
        </div>
      </div>

      {/* Tabs for organizing content */}
      <Tabs value={activeTab} onValueChange={(value) => {
        const tab = value as 'setup' | 'configuration' | 'fmv-benchmarking' | 'results';
        setActiveTab(tab);
        // Map tabs to steps
        if (tab === 'setup') setActiveStep(1);
        else if (tab === 'configuration') setActiveStep(2);
        else if (tab === 'fmv-benchmarking') setActiveStep(3);
        else if (tab === 'results') setActiveStep(4);
      }} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="setup" className="text-sm font-medium">
            Setup
          </TabsTrigger>
          <TabsTrigger value="configuration" className="text-sm font-medium" disabled={!step1Complete}>
            <span className="sm:hidden">Config</span>
            <span className="hidden sm:inline">Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="fmv-benchmarking" className="text-sm font-medium" disabled={!step2Complete}>
            <span className="sm:hidden">FMV</span>
            <span className="hidden sm:inline">FMV Benchmarking</span>
          </TabsTrigger>
          <TabsTrigger value="results" className="text-sm font-medium" disabled={!step2Complete}>
            Results
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab - Context */}
        <TabsContent value="setup" className="space-y-6 mt-0">
          {/* Mode Selector and Program Selector - Side by side */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
            <div className="inline-flex items-center rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-1 shadow-sm">
          <motion.button
            onClick={() => setModelingMode("quick")}
            disabled={false}
            className={cn(
              "relative flex items-center justify-center min-h-[36px] px-4 text-sm font-medium rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
              "transition-colors duration-200 ease-out",
              modelingMode === "quick"
                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            whileHover={modelingMode !== "quick" ? { scale: 1.02 } : {}}
            whileTap={{ scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
          >
            {modelingMode === "quick" && (
              <motion.div
                className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm"
                layoutId="activeMode"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10">Quick Budget</span>
          </motion.button>
          <div className="w-px h-5 bg-gray-200/50 dark:bg-gray-700/50 mx-0.5" />
          <motion.button
            onClick={() => {
              const activeProgram = getActiveProgram();
              if (activeProgram) {
                setModelingMode("advanced");
              }
            }}
            disabled={!getActiveProgram()}
            className={cn(
              "relative flex items-center justify-center min-h-[36px] px-4 text-sm font-medium rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
              "transition-colors duration-200 ease-out",
              modelingMode === "advanced"
                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            title={!getActiveProgram() ? "Please select a Call Program before starting Advanced Mode." : undefined}
            whileHover={modelingMode !== "advanced" && getActiveProgram() ? { scale: 1.02 } : {}}
            whileTap={getActiveProgram() ? { scale: 0.98 } : {}}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
          >
            {modelingMode === "advanced" && (
              <motion.div
                className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm"
                layoutId="activeMode"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
              />
            )}
            <span className="relative z-10">Advanced Mode            </span>
          </motion.button>
        </div>
        
        {/* Program Selector - Compact, all the way to the right */}
        <div className="sm:ml-auto min-w-0">
          <ProgramSelector compact />
        </div>
      </div>
      
      {modelingMode === "advanced" && !getActiveProgram() && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 rounded-lg bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200/60 dark:border-yellow-800/60 shadow-sm"
        >
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Please select a Call Program before starting Advanced Mode.
          </p>
        </motion.div>
      )}

          {/* Context Card */}
          <div id="context-card" data-tour="call-pay-context" className="space-y-6">
            <ContextCard 
              context={context}
              onContextChange={setContext}
            />
          </div>
        </TabsContent>

      {/* Welcome Walkthrough */}
      <WelcomeWalkthrough onNavigateToStep={handleWalkthroughNavigate} />

        {/* Configuration Tab - Tiers */}
        <TabsContent value="configuration" className="space-y-6 mt-0">
          <div id="tier-card" className="space-y-6" data-tour="call-pay-tiers">
            {/* Content */}
            <div className="space-y-6">
            {/* Provider Roster - Only show in Advanced Mode */}
            {modelingMode === "advanced" && providerRoster.length > 0 && (
              <ProviderRoster
                providers={providerRoster}
                tiers={tiers}
                onProvidersChange={setProviderRoster}
              />
            )}
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Configure Tiers</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
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
              </CardContent>
            </Card>

            {/* Tier Card - Show selected tier directly without accordion */}
            {tiers
              .filter((tier) => tier.id === expandedTier)
              .map((tier) => (
                <div key={tier.id} className="space-y-4">
                  <TierCard 
                    tier={tier} 
                    onTierChange={handleTierChange}
                    specialty={context.specialty as Specialty | undefined}
                    context={context}
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* FMV Benchmarking Tab */}
        <TabsContent value="fmv-benchmarking" className="space-y-6 mt-0">
          <div id="fmv-benchmarking" className="space-y-6" data-tour="call-pay-fmv-benchmarking">
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  FMV Benchmarking
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Enter market benchmark data to validate your call pay rates against FMV standards. This step is optional but recommended for compliance.
                </p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* Enable/Disable FMV Benchmarking Toggle */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex-1">
                    <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                      Enable FMV Benchmarking
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Compare your rates against market benchmarks to assess FMV compliance
                    </p>
                  </div>
                  <Switch
                    checked={enableFMVBenchmarks}
                    onCheckedChange={setEnableFMVBenchmarks}
                  />
                </div>

                {/* FMV Benchmark Panels for each enabled tier */}
                {enableFMVBenchmarks && enabledTiers.length > 0 && (
                  <div className="space-y-6">
                    {enabledTiers.map((tier) => (
                      <div key={tier.id} className="space-y-4">
                        <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            {tier.name} Tier Benchmarking
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Weekday: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(tier.rates.weekday)} • 
                            Weekend: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(tier.rates.weekend)} • 
                            Holiday: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(tier.rates.holiday)}
                          </p>
                        </div>
                        <FMVBenchmarkPanel
                          weekdayRate={tier.rates.weekday}
                          weekendRate={tier.rates.weekend}
                          holidayRate={tier.rates.holiday}
                          benchmarks={benchmarks}
                          onBenchmarksChange={setBenchmarks}
                          enabled={enableFMVBenchmarks}
                          onEnabledChange={setEnableFMVBenchmarks}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {enableFMVBenchmarks && enabledTiers.length === 0 && (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm">Please configure at least one tier in the Configuration tab before entering benchmarks.</p>
                  </div>
                )}

                {!enableFMVBenchmarks && (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p className="text-sm">Enable FMV Benchmarking above to enter market benchmark data and validate your rates.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab('configuration');
                  setActiveStep(2);
                }}
                className="w-full sm:w-auto min-h-[44px] touch-target"
              >
                <ChevronLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                Back to Configuration
              </Button>
              <Button
                onClick={() => {
                  setActiveTab('results');
                  setActiveStep(4);
                }}
                className="w-full sm:w-auto min-h-[44px] touch-target"
                disabled={!step2Complete}
              >
                Continue to Results
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Results Tab - Budget Review */}
        <TabsContent value="results" className="space-y-6 mt-0">
          <div id="impact-summary" className="space-y-6" data-tour="call-pay-budget">
            {/* Content */}
            <div className="space-y-6">
            <Card className="border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Budget Review</CardTitle>
                  {/* Tab Switcher - Apple-style Segmented Control - Only show in Advanced Mode */}
                  {modelingMode === "advanced" && (
                    <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5 shadow-sm">
                      <button
                        onClick={() => setBudgetReviewTab('cost')}
                        className={cn(
                          "relative flex items-center justify-center min-h-[32px] px-4 text-sm font-medium transition-all duration-200 rounded-md",
                          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                          budgetReviewTab === 'cost'
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <DollarSign className="w-4 h-4 mr-1.5" />
                        Cost Estimate
                      </button>
                      <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
                      <button
                        onClick={() => setBudgetReviewTab('burden')}
                        className={cn(
                          "relative flex items-center justify-center min-h-[32px] px-4 text-sm font-medium transition-all duration-200 rounded-md",
                          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                          budgetReviewTab === 'burden'
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <Scale className="w-4 h-4 mr-1.5" />
                        Burden & Fairness
                      </button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                {modelingMode === "quick" || budgetReviewTab === 'cost' ? (
                  <>
                    <ImpactSummary 
                      impact={impact} 
                      annualAllowableBudget={annualAllowableBudget}
                      onBudgetChange={setAnnualAllowableBudget}
                      tiers={tiers}
                      context={context}
                      providerRoster={providerRoster}
                    />
                    {/* FMV Compliance Analysis */}
                    {(() => {
                      try {
                        // Get effective rate from engine
                        const engineInputs = mapCallPayStateToEngineInputs(context, providerRoster, tiers);
                        const engineResult = calculateCallBudget(
                          engineInputs.program,
                          engineInputs.providers,
                          engineInputs.tiers,
                          engineInputs.assumptions
                        );
                        
                        // Get active tier for coverage type
                        const activeTier = tiers.find(t => t.enabled) || tiers[0];
                        const coverageType = activeTier?.coverageType || 'In-house';
                        
                        // Get burden score from fairness metrics if available (only in Advanced Mode with roster)
                        // In Quick Mode, burden score is optional
                        let burdenScore: number | undefined;
                        if (providerRoster.length > 0) {
                          const burdenResults = calculateExpectedBurden(providerRoster, engineInputs.assumptions);
                          const fairnessMetrics = calculateFairnessMetrics(burdenResults);
                          burdenScore = fairnessMetrics.fairnessScore;
                        }
                        
                        return (
                          <FMVPanel
                            specialty={context.specialty || ''}
                            coverageType={coverageType}
                            effectiveRatePer24h={engineResult.effectivePer24h}
                            burdenScore={burdenScore}
                          />
                        );
                      } catch (error) {
                        console.error('Error preparing FMV analysis:', error);
                        return null;
                      }
                    })()}
                  </>
                ) : modelingMode === "advanced" && (
                  (() => {
                    // Get assumptions from adapter
                    try {
                      const engineInputs = mapCallPayStateToEngineInputs(context, providerRoster, tiers);
                      const activeTier = tiers.find(t => t.enabled) || tiers[0];
                      
                      const handleGenerateSchedule = () => {
                        const schedule = generateCallSchedule({
                          year: context.modelYear,
                          providers: providerRoster,
                          assumptions: engineInputs.assumptions,
                          activeTierId: activeTier?.id || null,
                        });
                        setCallSchedule(schedule);
                      };

                      return (
                        <BurdenFairnessPanel
                          providers={providerRoster}
                          assumptions={engineInputs.assumptions}
                          schedule={callSchedule}
                          onScheduleChange={setCallSchedule}
                          onGenerateSchedule={handleGenerateSchedule}
                          tiers={tiers}
                        />
                      );
                    } catch (error) {
                      console.error('Error preparing burden analysis:', error);
                      // Even if there's an error, show the panel with empty data so user can load test data
                      const defaultAssumptions = {
                        weekdayCallsPerMonth: 5,
                        weekendCallsPerMonth: 2,
                        holidaysPerYear: 10,
                      };
                      
                      const handleGenerateSchedule = () => {
                        const schedule = generateCallSchedule({
                          year: context.modelYear || new Date().getFullYear(),
                          providers: providerRoster,
                          assumptions: defaultAssumptions,
                          activeTierId: tiers.find(t => t.enabled)?.id || tiers[0]?.id || null,
                        });
                        setCallSchedule(schedule);
                      };

                      return (
                        <BurdenFairnessPanel
                          providers={providerRoster}
                          assumptions={defaultAssumptions}
                          schedule={callSchedule}
                          onScheduleChange={setCallSchedule}
                          onGenerateSchedule={handleGenerateSchedule}
                          tiers={tiers}
                        />
                      );
                    }
                  })()
                )}
              </CardContent>
            </Card>
            
            {/* Export Executive Report - Show when a scenario is active */}
            {activeScenarioId && (
              <div className="flex justify-end">
                <ExecutiveReportExport
                  activeScenarioId={activeScenarioId}
                  className="min-h-[44px] touch-target"
                />
              </div>
            )}
            
            {/* FMV Override Tracker - Only show if FMV benchmarks are enabled */}
            {enableFMVBenchmarks && Object.keys(benchmarks).length > 0 && (
              <Card className="border-2">
                <CardContent className="p-4 sm:p-6">
                  <FMVOverrideTracker
                    tiers={tiers}
                    benchmarks={benchmarks}
                    overrides={complianceMetadata.fmvOverrides}
                    onOverridesChange={(overrides) =>
                      setComplianceMetadata((prev) => ({ ...prev, fmvOverrides: overrides }))
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* Action Buttons - Auto-hide on mobile, static on desktop */}
            <AutoHideSticky className="bg-gray-50 dark:bg-gray-900 pt-4 pb-4 border-t-2 border-gray-200 dark:border-gray-800 safe-area-inset-bottom z-10">
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab('fmv-benchmarking');
                    setActiveStep(3);
                  }}
                  className="w-full sm:w-auto min-h-[44px] touch-target"
                >
                  <ChevronLeft className="w-4 h-4 mr-2 flex-shrink-0" />
                  Back to FMV Benchmarking
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <CallPaySaveButton
                  context={context}
                  tiers={tiers}
                  impact={impact}
                  annualAllowableBudget={annualAllowableBudget}
                  currentScenarioId={currentScenarioId}
                />
                <ComplianceExport
                  context={context}
                  tiers={tiers}
                  impact={impact}
                  benchmarks={benchmarks}
                  complianceMetadata={complianceMetadata}
                />
              </div>
              <div className="mt-3">
                <Button
                  variant="outline"
                  onClick={handleStartOver}
                  className="w-full sm:w-auto min-h-[44px] touch-target"
                >
                  <RotateCcw className="w-4 h-4 mr-2 flex-shrink-0" />
                  Start New Calculation
                </Button>
              </div>
            </AutoHideSticky>
          </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
