/**
 * CF Stewardship Utilities
 * 
 * Functions for CF stewardship dashboard calculations
 * All calculations reuse existing Phase 1 & 2 logic
 */

import {
  StewardshipScenario,
  StewardshipComparison,
  BudgetImpact,
  MarketMovement,
} from '@/types/cf-stewardship';
import { ConversionFactorModel } from '@/types/cf-models';
import { MarketBenchmarks, FTE } from '@/types';
import { calculateScenarioResult, getAlignmentStatus } from './scenario-modeling';
import { ProductivityScenario, AlignmentStatus } from '@/types/physician-scenarios';

/**
 * Generate stewardship scenarios from market benchmarks
 * Creates scenarios for 25th, 50th, 75th, and 90th percentiles
 */
export function generateStewardshipScenarios(
  marketBenchmarks: MarketBenchmarks
): StewardshipScenario[] {
  const scenarios: StewardshipScenario[] = [];

  if (marketBenchmarks.wrvu25) {
    scenarios.push({
      id: 'percentile-25',
      name: '25th Percentile',
      wrvus: marketBenchmarks.wrvu25,
      percentile: 25,
    });
  }

  if (marketBenchmarks.wrvu50) {
    scenarios.push({
      id: 'percentile-50',
      name: '50th Percentile',
      wrvus: marketBenchmarks.wrvu50,
      percentile: 50,
    });
  }

  if (marketBenchmarks.wrvu75) {
    scenarios.push({
      id: 'percentile-75',
      name: '75th Percentile',
      wrvus: marketBenchmarks.wrvu75,
      percentile: 75,
    });
  }

  if (marketBenchmarks.wrvu90) {
    scenarios.push({
      id: 'percentile-90',
      name: '90th Percentile',
      wrvus: marketBenchmarks.wrvu90,
      percentile: 90,
    });
  }

  return scenarios;
}

/**
 * Calculate stewardship comparison for a single scenario
 * Compares current vs proposed CF models
 */
export function calculateStewardshipComparison(
  scenario: StewardshipScenario,
  currentCFModel: ConversionFactorModel,
  proposedCFModel: ConversionFactorModel,
  basePay: number,
  fte: FTE,
  marketBenchmarks: MarketBenchmarks
): StewardshipComparison {
  // Convert stewardship scenario to productivity scenario format
  const productivityScenario: ProductivityScenario = {
    id: scenario.id,
    name: scenario.name,
    wrvus: scenario.wrvus,
    useActualProductivity: scenario.isActual || false,
  };

  // Calculate results for current CF
  const currentResult = calculateScenarioResult(
    productivityScenario,
    currentCFModel,
    basePay,
    fte,
    marketBenchmarks
  );

  // Calculate results for proposed CF
  const proposedResult = calculateScenarioResult(
    productivityScenario,
    proposedCFModel,
    basePay,
    fte,
    marketBenchmarks
  );

  // Calculate percentile match (difference between proposed TCC percentile and wRVU percentile)
  const percentileMatch = proposedResult.tccPercentile - proposedResult.wrvuPercentile;

  // Overall alignment status for proposed CF
  const alignmentStatus = getAlignmentStatus(
    proposedResult.wrvuPercentile,
    proposedResult.tccPercentile
  );

  return {
    scenario,
    // Current CF results
    currentIncentivePay: currentResult.incentivePay,
    currentSurveyTCC: currentResult.surveyTCC,
    currentTccPercentile: currentResult.tccPercentile,
    currentAlignmentStatus: currentResult.alignmentStatus,
    // Proposed CF results
    proposedIncentivePay: proposedResult.incentivePay,
    proposedSurveyTCC: proposedResult.surveyTCC,
    proposedTccPercentile: proposedResult.tccPercentile,
    proposedAlignmentStatus: proposedResult.alignmentStatus,
    // Comparison metrics
    percentileMatch,
    alignmentStatus,
  };
}

/**
 * Evaluate CF proposal across all scenarios
 * Returns overall alignment status based on worst-case scenario
 */
export function evaluateCfProposal(
  comparisons: StewardshipComparison[]
): AlignmentStatus {
  if (comparisons.length === 0) {
    return 'Aligned'; // Default if no comparisons
  }

  // Calculate deltas for each scenario
  const deltas = comparisons.map((c) => c.percentileMatch);
  const maxDelta = Math.max(...deltas);
  const minDelta = Math.min(...deltas);

  // Use worst-case scenario (largest absolute deviation)
  const worstDelta = Math.max(Math.abs(maxDelta), Math.abs(minDelta));

  // Apply alignment logic
  if (worstDelta >= 15) {
    return 'Risk Zone';
  } else if (worstDelta > 10) {
    return 'Mild Drift';
  } else {
    return 'Aligned';
  }
}

/**
 * Calculate budget impact
 */
export function calculateBudgetImpact(
  medianWrvus: number,
  providerCount: number,
  currentCFModel: ConversionFactorModel,
  proposedCFModel: ConversionFactorModel,
  basePay: number,
  fte: FTE,
  marketBenchmarks: MarketBenchmarks
): BudgetImpact {
  // Create productivity scenario for median wRVUs
  const medianScenario: ProductivityScenario = {
    id: 'median-impact',
    name: 'Median',
    wrvus: medianWrvus,
    useActualProductivity: false,
  };

  // Calculate TCC for current CF
  const currentResult = calculateScenarioResult(
    medianScenario,
    currentCFModel,
    basePay,
    fte,
    marketBenchmarks
  );

  // Calculate TCC for proposed CF
  const proposedResult = calculateScenarioResult(
    medianScenario,
    proposedCFModel,
    basePay,
    fte,
    marketBenchmarks
  );

  // Calculate deltas
  const deltaPerFTE = proposedResult.surveyTCC - currentResult.surveyTCC;
  const totalBudgetImpact = deltaPerFTE * providerCount;
  const averageProviderImpact = deltaPerFTE;

  return {
    medianWrvus,
    providerCount,
    currentTCCPerFTE: currentResult.surveyTCC,
    proposedTCCPerFTE: proposedResult.surveyTCC,
    deltaPerFTE,
    totalBudgetImpact,
    averageProviderImpact,
  };
}

/**
 * Calculate market movement (year-over-year changes)
 * Compares current year benchmarks to last year benchmarks
 */
export function calculateMarketMovement(
  currentBenchmarks: MarketBenchmarks,
  lastYearBenchmarks?: MarketBenchmarks
): MarketMovement {
  if (!lastYearBenchmarks) {
    return {};
  }

  const currentTccMedian = currentBenchmarks.tcc50;
  const lastYearTccMedian = lastYearBenchmarks.tcc50;
  const currentWrvuMedian = currentBenchmarks.wrvu50;
  const lastYearWrvuMedian = lastYearBenchmarks.wrvu50;

  let tccMedianChange: number | undefined;
  let wrvuMedianChange: number | undefined;

  if (currentTccMedian && lastYearTccMedian && lastYearTccMedian > 0) {
    tccMedianChange = ((currentTccMedian - lastYearTccMedian) / lastYearTccMedian) * 100;
  }

  if (currentWrvuMedian && lastYearWrvuMedian && lastYearWrvuMedian > 0) {
    wrvuMedianChange = ((currentWrvuMedian - lastYearWrvuMedian) / lastYearWrvuMedian) * 100;
  }

  return {
    tccMedianChange,
    wrvuMedianChange,
    lastYearTccMedian,
    currentYearTccMedian: currentTccMedian,
    lastYearWrvuMedian,
    currentYearWrvuMedian: currentWrvuMedian,
  };
}

/**
 * Apply percentage adjustment to a CF model
 * Creates a new proposed CF model based on percentage adjustment
 */
export function applyPercentageAdjustment(
  currentCFModel: ConversionFactorModel,
  adjustmentPercent: number
): ConversionFactorModel {
  // For single CF, apply percentage directly
  if (currentCFModel.modelType === 'single') {
    const currentCF = (currentCFModel.parameters as { cf: number }).cf;
    const adjustedCF = currentCF * (1 + adjustmentPercent / 100);
    return {
      modelType: 'single',
      parameters: { cf: adjustedCF },
    };
  }

  // For other model types, we'd need more complex logic
  // For Phase 3, we'll primarily support single CF adjustments
  // Tiered and other models would require manual input
  return currentCFModel;
}

