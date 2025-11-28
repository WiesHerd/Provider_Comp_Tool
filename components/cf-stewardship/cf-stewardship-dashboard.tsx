'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDebouncedLocalStorage } from '@/hooks/use-debounced-local-storage';
import { ConversionFactorModel } from '@/types/cf-models';
import { MarketBenchmarks, FTE } from '@/types';
import { AlignmentStatus } from '@/types/physician-scenarios';
import {
  StewardshipComparison,
  BudgetImpact,
  MarketMovement,
} from '@/types/cf-stewardship';
import { CFStewardshipContext } from './cf-stewardship-context';
import { CFProposalSection } from './cf-proposal-section';
import { StewardshipComparisonTable } from './stewardship-comparison-table';
import { RecommendationPanel } from './recommendation-panel';
import { BudgetImpactCard } from './budget-impact-card';
import { ExportPanel } from './export-panel';
import {
  generateStewardshipScenarios,
  calculateStewardshipComparison,
  evaluateCfProposal,
  calculateBudgetImpact,
  calculateMarketMovement,
} from '@/lib/utils/cf-stewardship';
import { getAlignmentStatus } from '@/lib/utils/scenario-modeling';

const STORAGE_KEY = 'cfStewardshipDashboardDraftState';

export function CFStewardshipDashboard() {
  const [specialty, setSpecialty] = useState<string>('');
  const [modelYear, setModelYear] = useState<number>(new Date().getFullYear());
  const [surveySource, setSurveySource] = useState<string>('');
  const [fte, setFte] = useState<FTE>(1.0);
  const [basePay, setBasePay] = useState<number>(0);
  const [currentCFModel, setCurrentCFModel] = useState<ConversionFactorModel>({
    modelType: 'single',
    parameters: { cf: 0 },
  });
  const [proposedCFModel, setProposedCFModel] = useState<ConversionFactorModel>({
    modelType: 'single',
    parameters: { cf: 0 },
  });
  const [adjustmentType, setAdjustmentType] = useState<'manual' | 'percentage'>('manual');
  const [adjustmentPercent, setAdjustmentPercent] = useState<number>(0);
  const [lastYearCF, setLastYearCF] = useState<number | undefined>(undefined);
  const [lastYearBenchmarks, setLastYearBenchmarks] = useState<MarketBenchmarks | undefined>(undefined);
  const [marketBenchmarks, setMarketBenchmarks] = useState<MarketBenchmarks>({});
  const [providerCount, setProviderCount] = useState<number>(1);
  const [medianWrvus, setMedianWrvus] = useState<number>(0);

  // Auto-save draft state
  const draftState = {
    specialty,
    modelYear,
    surveySource,
    fte,
    basePay,
    currentCFModel,
    proposedCFModel,
    adjustmentType,
    adjustmentPercent,
    lastYearCF,
    marketBenchmarks,
    providerCount,
    medianWrvus,
  };
  useDebouncedLocalStorage(STORAGE_KEY, draftState);

  // Load draft state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setSpecialty(draft.specialty || '');
        setModelYear(draft.modelYear || new Date().getFullYear());
        setSurveySource(draft.surveySource || '');
        setFte(draft.fte || 1.0);
        setBasePay(draft.basePay || 0);
        setCurrentCFModel(draft.currentCFModel || { modelType: 'single', parameters: { cf: 0 } });
        setProposedCFModel(draft.proposedCFModel || { modelType: 'single', parameters: { cf: 0 } });
        setAdjustmentType(draft.adjustmentType || 'manual');
        setAdjustmentPercent(draft.adjustmentPercent || 0);
        setLastYearCF(draft.lastYearCF);
        setMarketBenchmarks(draft.marketBenchmarks || {});
        setProviderCount(draft.providerCount || 1);
        setMedianWrvus(draft.medianWrvus || 0);
      }
    } catch (error) {
      console.error('Error loading draft state:', error);
    }
  }, []);

  // Generate scenarios from market benchmarks
  const scenarios = useMemo(() => {
    if (!marketBenchmarks || Object.keys(marketBenchmarks).length === 0) {
      return [];
    }
    return generateStewardshipScenarios(marketBenchmarks);
  }, [marketBenchmarks]);

  // Calculate comparisons for all scenarios
  const comparisons = useMemo<StewardshipComparison[]>(() => {
    if (
      scenarios.length === 0 ||
      !marketBenchmarks ||
      Object.keys(marketBenchmarks).length === 0 ||
      basePay <= 0
    ) {
      return [];
    }

    return scenarios.map((scenario) =>
      calculateStewardshipComparison(
        scenario,
        currentCFModel,
        proposedCFModel,
        basePay,
        fte,
        marketBenchmarks
      )
    );
  }, [scenarios, currentCFModel, proposedCFModel, basePay, fte, marketBenchmarks]);

  // Evaluate overall alignment
  const overallAlignment = useMemo<AlignmentStatus>(() => {
    if (comparisons.length === 0) {
      return 'Aligned';
    }
    return evaluateCfProposal(comparisons);
  }, [comparisons]);

  // Calculate alignment snapshot for current CF
  const alignmentSnapshot = useMemo<AlignmentStatus | undefined>(() => {
    if (comparisons.length === 0) {
      return undefined;
    }
    // Use the median scenario (50th percentile) for snapshot
    const medianComparison = comparisons.find((c) => c.scenario.percentile === 50);
    if (!medianComparison) {
      return undefined;
    }
    return getAlignmentStatus(
      medianComparison.scenario.percentile,
      medianComparison.currentTccPercentile
    );
  }, [comparisons]);

  // Calculate market movement
  const marketMovement = useMemo<MarketMovement | undefined>(() => {
    if (!lastYearBenchmarks || !marketBenchmarks) {
      return undefined;
    }
    return calculateMarketMovement(marketBenchmarks, lastYearBenchmarks);
  }, [marketBenchmarks, lastYearBenchmarks]);

  // Calculate budget impact
  const budgetImpact = useMemo<BudgetImpact | null>(() => {
    if (
      medianWrvus <= 0 ||
      providerCount <= 0 ||
      !marketBenchmarks ||
      Object.keys(marketBenchmarks).length === 0 ||
      basePay <= 0
    ) {
      return null;
    }

    return calculateBudgetImpact(
      medianWrvus,
      providerCount,
      currentCFModel,
      proposedCFModel,
      basePay,
      fte,
      marketBenchmarks
    );
  }, [medianWrvus, providerCount, currentCFModel, proposedCFModel, basePay, fte, marketBenchmarks]);

  // Update median wRVUs when benchmarks change
  useEffect(() => {
    if (marketBenchmarks.wrvu50 && medianWrvus === 0) {
      setMedianWrvus(marketBenchmarks.wrvu50);
    }
  }, [marketBenchmarks, medianWrvus]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 sm:pb-6">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 md:pb-12">
        <div className="pt-6 sm:pt-8 md:pt-10 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              CF Stewardship Dashboard
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-3xl">
              This view supports annual conversion factor review. It compares your current CF model
              to survey benchmarks and modeled wRVU scenarios, highlighting whether proposed changes
              keep compensation aligned with productivity levels and within fair market value (FMV)
              expectations. This does NOT use EMR data. It is a stand-alone modeling and governance
              tool.
            </p>
          </div>

          {/* Context Panel */}
          <CFStewardshipContext
            specialty={specialty}
            modelYear={modelYear}
            surveySource={surveySource}
            currentCFModel={currentCFModel}
            lastYearCF={lastYearCF}
            marketMovement={marketMovement}
            alignmentSnapshot={alignmentSnapshot}
            onSpecialtyChange={setSpecialty}
            onModelYearChange={setModelYear}
            onSurveySourceChange={setSurveySource}
            onLastYearCFChange={setLastYearCF}
            onMarketDataLoad={(benchmarks) => {
              setMarketBenchmarks(benchmarks);
            }}
          />

          {/* CF Proposal Section */}
          <CFProposalSection
            currentCFModel={currentCFModel}
            proposedCFModel={proposedCFModel}
            adjustmentType={adjustmentType}
            adjustmentPercent={adjustmentPercent}
            fte={fte}
            onCurrentCFModelChange={setCurrentCFModel}
            onProposedCFModelChange={setProposedCFModel}
            onAdjustmentTypeChange={setAdjustmentType}
            onAdjustmentPercentChange={setAdjustmentPercent}
          />

          {/* Additional Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Base Pay
              </label>
              <input
                type="number"
                value={basePay || ''}
                onChange={(e) => setBasePay(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Enter base pay"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">FTE</label>
              <input
                type="number"
                value={fte || ''}
                onChange={(e) => setFte(parseFloat(e.target.value) || 1.0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Enter FTE"
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          </div>

          {/* Stewardship Comparison Table */}
          <StewardshipComparisonTable comparisons={comparisons} />

          {/* Recommendation Panel */}
          <RecommendationPanel alignmentStatus={overallAlignment} />

          {/* Budget Impact Card */}
          <BudgetImpactCard
            budgetImpact={budgetImpact}
            providerCount={providerCount}
            medianWrvus={medianWrvus}
            onProviderCountChange={setProviderCount}
            onMedianWrvusChange={setMedianWrvus}
          />

          {/* Export Panel */}
          <ExportPanel
            comparisons={comparisons}
            specialty={specialty}
            modelYear={modelYear}
          />
        </div>
      </div>
    </div>
  );
}

