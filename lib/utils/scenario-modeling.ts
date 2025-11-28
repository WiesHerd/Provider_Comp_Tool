/**
 * Scenario Modeling Utilities
 * 
 * Functions for calculating compensation scenarios based on wRVU productivity
 */

import { AlignmentStatus, ProductivityScenario, ScenarioResult } from '@/types/physician-scenarios';
import { MarketBenchmarks, FTE } from '@/types';
import { ConversionFactorModel } from '@/types/cf-models';
import { calculateWRVUPercentile, calculateTCCPercentile, calculateCFPercentile, getTccValueAtPercentile } from './percentile';
import { normalizeTcc } from './normalization';
import { calculateIncentivePayWithModel, getCFModelSummary } from './cf-model-engine';

/**
 * Calculate incentive pay: (wRVUs * CF) - basePay
 * Can be negative if wRVU compensation is less than base salary
 */
export function calculateIncentivePay(wrvus: number, conversionFactor: number, basePay: number): number {
  const wrvuCompensation = wrvus * conversionFactor;
  return wrvuCompensation - basePay;
}

/**
 * Calculate clinical TCC (Productivity Incentive component only)
 */
export function calculateClinicalTCC(incentivePay: number): number {
  // Clinical TCC is just the productivity incentive
  return Math.max(0, incentivePay);
}

/**
 * Calculate survey TCC (Full TCC: Base + Productivity + other components)
 * For Phase 1, we assume Base + Productivity only
 */
export function calculateSurveyTCC(basePay: number, incentivePay: number): number {
  // Survey TCC = Base + Productivity
  return basePay + Math.max(0, incentivePay);
}

/**
 * Get alignment status based on wRVU and TCC percentiles
 * 
 * FMV Compliance Standards:
 * - TCC > 90th percentile: HIGH FMV risk - should be avoided unless exceptional justification
 * - TCC 75-90th percentile: Risk Zone - requires thorough documentation and justification
 * - TCC ≤ 75th percentile: Safe zone - use alignment logic based on wRVU/TCC percentile delta
 * 
 * Alignment evaluation (for TCC ≤ 75th):
 * - |delta| ≤ 10 → "Aligned" (TCC percentile matches wRVU percentile closely)
 * - |delta| ≤ 15 → "Mild Drift" (some deviation but acceptable)
 * - Else → "Risk Zone" (significant misalignment)
 * 
 * The principle: wRVU percentile and TCC percentile should "walk together"
 * if CF is set correctly, while staying within FMV compliance thresholds.
 */
export function getAlignmentStatus(wrvuPercentile: number, tccPercentile: number): AlignmentStatus {
  const delta = tccPercentile - wrvuPercentile;
  
  // FMV Compliance: Absolute TCC percentile thresholds
  // TCC > 90th percentile = High Risk (regardless of alignment)
  if (tccPercentile > 90) {
    return 'Risk Zone'; // High FMV risk
  }
  
  // TCC 75-90th percentile = Risk Zone (requires documentation)
  // Even if aligned, being in this range requires justification
  if (tccPercentile >= 75 && tccPercentile <= 90) {
    return 'Risk Zone'; // FMV risk zone - needs documentation
  }
  
  // TCC ≤ 75th percentile: Use alignment logic
  if (Math.abs(delta) <= 10) {
    return 'Aligned'; // Green badge
  } else if (Math.abs(delta) <= 15) {
    return 'Mild Drift'; // Yellow badge
  } else {
    return 'Risk Zone'; // Red badge
  }
}

/**
 * Calculate recommended CF for a scenario
 * 
 * Logic:
 * 1. Get wRVU percentile from scenario's wRVUs
 * 2. Use that percentile to get target TCC from survey TCC curve
 * 3. Subtract fixed comp to get target clinical dollars
 * 4. Calculate recommended CF = target clinical dollars / wRVUs
 * 
 * This recommended CF shows what CF would make TCC percentile ≈ wRVU percentile
 * for that scenario.
 */
export function calculateRecommendedCF(
  scenario: ProductivityScenario,
  fixedComp: number,
  fte: FTE,
  marketBenchmarks: MarketBenchmarks
): number | null {
  if (scenario.wrvus <= 0) {
    return null;
  }

  // Normalize wRVUs for percentile calculation
  const normalizedWrvus = scenario.wrvus / (fte || 1.0);
  
  // Get wRVU percentile
  const wrvuPercentile = calculateWRVUPercentile(normalizedWrvus, marketBenchmarks);
  
  // Get target TCC at that percentile
  const targetTcc = getTccValueAtPercentile(wrvuPercentile, marketBenchmarks);
  
  if (!targetTcc || targetTcc <= 0) {
    return null;
  }

  // Normalize target TCC to current FTE
  const targetTccForFte = targetTcc * (fte || 1.0);
  
  // Calculate target clinical dollars
  // targetTcc = fixedComp + clinicalDollars
  // clinicalDollars = targetTcc - fixedComp
  const targetClinicalDollars = targetTccForFte - fixedComp;
  
  // Calculate recommended CF
  // recommendedCf = targetClinicalDollars / wrvus
  const recommendedCf = targetClinicalDollars / scenario.wrvus;
  
  return Math.max(0, recommendedCf); // Ensure non-negative
}

/**
 * Calculate clinical dollars from CF model
 * 
 * Clinical dollars = wRVUs * effective CF (from the model)
 * This represents the productivity incentive component of compensation
 */
function calculateClinicalDollars(
  wrvus: number,
  cfModel: ConversionFactorModel,
  fte: FTE,
  marketBenchmarks: MarketBenchmarks
): number {
  // For single CF model, it's straightforward: wrvus * cf
  if (cfModel.modelType === 'single') {
    const cf = (cfModel.parameters as { cf: number }).cf;
    return wrvus * cf;
  }
  
  // For other models, we need to calculate the total compensation from the model
  // and extract the clinical dollars portion
  // We use a basePay of 0 to get just the clinical component
  const incentivePay = calculateIncentivePayWithModel(
    wrvus,
    cfModel,
    0, // basePay = 0 to get pure clinical dollars
    fte,
    marketBenchmarks
  );
  
  // Clinical dollars is the positive incentive pay
  return Math.max(0, incentivePay);
}

/**
 * Calculate scenario result for a given productivity scenario
 * 
 * Now supports multiple CF model types through the ConversionFactorModel interface
 * 
 * Core principle: For a given wRVU level, CF should produce a TCC percentile
 * roughly equal to the wRVU percentile.
 */
export function calculateScenarioResult(
  scenario: ProductivityScenario,
  cfModel: ConversionFactorModel,
  basePay: number,
  fte: FTE,
  marketBenchmarks: MarketBenchmarks
): ScenarioResult {
  // Use scenario's fixedComp if provided, otherwise fall back to basePay
  const fixedComp = scenario.fixedComp ?? basePay;
  
  // Calculate clinical dollars from CF model
  const clinicalDollars = calculateClinicalDollars(
    scenario.wrvus,
    cfModel,
    fte,
    marketBenchmarks
  );
  
  // Calculate effective CF (Clinical dollars / wRVUs)
  const effectiveCF = scenario.wrvus > 0 ? clinicalDollars / scenario.wrvus : 0;
  
  // Calculate modeled TCC = fixed comp + clinical dollars
  const modeledTcc = fixedComp + clinicalDollars;
  
  // Normalize wRVUs for percentile calculation
  const normalizedWrvus = scenario.wrvus / (fte || 1.0);
  
  // Normalize modeled TCC for percentile comparison
  const normalizedModeledTcc = normalizeTcc(modeledTcc, fte);
  
  // Get percentiles (mandatory market validation)
  const wrvuPercentile = calculateWRVUPercentile(normalizedWrvus, marketBenchmarks);
  const tccPercentile = calculateTCCPercentile(normalizedModeledTcc, marketBenchmarks);
  
  // Calculate CF percentile if CF market data is available
  const cfPercentile = marketBenchmarks.cf25 || marketBenchmarks.cf50 || 
                       marketBenchmarks.cf75 || marketBenchmarks.cf90
    ? calculateCFPercentile(effectiveCF, marketBenchmarks)
    : undefined;
  
  // Calculate alignment status
  const alignmentStatus = getAlignmentStatus(wrvuPercentile, tccPercentile);
  
  // Calculate recommended CF
  const recommendedCF = calculateRecommendedCF(scenario, fixedComp, fte, marketBenchmarks);
  
  // Get CF model summary for display
  const cfModelSummary = getCFModelSummary(cfModel);
  
  // Calculate incentive pay (for backward compatibility)
  // This is clinicalDollars - basePay (can be negative)
  const incentivePay = clinicalDollars - basePay;
  
  // Calculate survey TCC (Base + Productivity) for backward compatibility
  const surveyTCC = basePay + Math.max(0, incentivePay);
  
  return {
    scenario,
    cfModelType: cfModel.modelType,
    cfModelSummary,
    wrvuPercentile,
    effectiveCF,
    incentivePay,
    clinicalDollars,
    modeledTcc,
    surveyTCC,
    tccPercentile,
    cfPercentile,
    alignmentStatus,
    recommendedCF,
  };
}

