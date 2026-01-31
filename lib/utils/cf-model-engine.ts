/**
 * CF Model Engine
 * 
 * Central calculation engine for all conversion factor model types
 */

import {
  ConversionFactorModel,
  SingleCFParameters,
  TieredCFParameters,
  PercentileTieredCFParameters,
  BudgetNeutralCFParameters,
  QualityWeightedCFParameters,
  FTEAdjustedCFParameters,
} from '@/types/cf-models';
import { FTE, MarketBenchmarks } from '@/types';
import { calculateWRVUPercentile } from './percentile';

/**
 * Calculate incentive pay using a CF model
 * 
 * @param wrvus - Annual wRVUs
 * @param model - CF model configuration
 * @param basePay - Base salary
 * @param fte - Full-time equivalent
 * @param marketBenchmarks - Market benchmark data (required for budget-neutral model)
 * @returns Incentive pay amount (can be negative)
 */
export function calculateIncentivePayWithModel(
  wrvus: number,
  model: ConversionFactorModel,
  basePay: number,
  fte: FTE,
  marketBenchmarks?: MarketBenchmarks
): number {
  switch (model.modelType) {
    case 'single':
      return calculateSingleCF(wrvus, model.parameters as SingleCFParameters, basePay);
    case 'tiered':
      return calculateTieredCF(wrvus, model.parameters as TieredCFParameters, basePay);
    case 'percentile-tiered':
      if (!marketBenchmarks) {
        throw new Error('Market benchmarks required for percentile-tiered CF model');
      }
      return calculatePercentileTieredCF(
        wrvus,
        model.parameters as PercentileTieredCFParameters,
        basePay,
        fte,
        marketBenchmarks
      );
    case 'budget-neutral':
      if (!marketBenchmarks) {
        throw new Error('Market benchmarks required for budget-neutral CF model');
      }
      return calculateBudgetNeutralCF(
        wrvus,
        model.parameters as BudgetNeutralCFParameters,
        basePay,
        fte,
        marketBenchmarks
      );
    case 'quality-weighted':
      return calculateQualityWeightedCF(
        wrvus,
        model.parameters as QualityWeightedCFParameters,
        basePay
      );
    case 'fte-adjusted':
      return calculateFTEAdjustedCF(
        wrvus,
        model.parameters as FTEAdjustedCFParameters,
        basePay,
        fte
      );
    default:
      // TypeScript should never reach here if all cases are handled
      throw new Error(`Unknown CF model type: ${(model.modelType as never)}`);
  }
}

/**
 * Calculate incentive pay for Single CF model
 */
function calculateSingleCF(
  wrvus: number,
  parameters: SingleCFParameters,
  basePay: number
): number {
  const wrvuCompensation = wrvus * parameters.cf;
  return wrvuCompensation - basePay;
}

/**
 * Calculate incentive pay for Tiered CF model
 */
function calculateTieredCF(
  wrvus: number,
  parameters: TieredCFParameters,
  basePay: number
): number {
  const { tierType, tiers } = parameters;
  let totalCompensation = 0;

  if (tierType === 'threshold') {
    // Threshold-based: Apply CF to wRVU ranges
    // Example: 0-4000 @ $55, 4001-6000 @ $60, 6001+ @ $70
    // Threshold represents the upper bound of that tier
    let previousThreshold = 0;
    
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const nextTier = tiers[i + 1];
      
      if (nextTier && tier.threshold !== undefined) {
        // Not the last tier - apply CF to wRVUs in this range
        const tierStart = previousThreshold;
        const tierEnd = tier.threshold;
        // Calculate how many wRVUs fall in this tier
        const tierWrvus = Math.max(0, Math.min(wrvus - tierStart, tierEnd - tierStart));
        totalCompensation += tierWrvus * tier.cf;
        previousThreshold = tierEnd;
      } else {
        // Last tier - apply CF to all remaining wRVUs
        // If final tier has a threshold, use that; otherwise use previous threshold
        const finalTierThreshold = tier.threshold !== undefined ? tier.threshold : previousThreshold;
        const tierWrvus = Math.max(0, wrvus - finalTierThreshold);
        totalCompensation += tierWrvus * tier.cf;
        break;
      }
    }
  } else {
    // Percentage-based: Apply CF to percentage ranges of total wRVUs
    // Example: 0-50% @ $55, 50-80% @ $60, 80%+ @ $70
    const totalWrvus = wrvus;
    let previousPercentage = 0;
    
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const nextTier = tiers[i + 1];
      
      if (nextTier && tier.threshold !== undefined) {
        // Not the last tier - apply CF to percentage range
        const tierStartPercent = previousPercentage;
        const tierEndPercent = tier.threshold;
        const tierWrvus = ((tierEndPercent - tierStartPercent) / 100) * totalWrvus;
        totalCompensation += tierWrvus * tier.cf;
        previousPercentage = tierEndPercent;
      } else {
        // Last tier - apply CF to remaining percentage
        const tierWrvus = ((100 - previousPercentage) / 100) * totalWrvus;
        totalCompensation += tierWrvus * tier.cf;
        break;
      }
    }
  }

  return totalCompensation - basePay;
}

/**
 * Calculate incentive pay for Percentile-Based Tiered CF model
 * 
 * Tiers are defined by productivity percentiles. The system:
 * 1. Calculates what percentile the actual wRVU value is in market data
 * 2. Finds which tier that percentile falls into
 * 3. Applies that tier's CF rate to all wRVUs
 * 
 * Example: If tiers are 0-33rd @ $50, 33-55th @ $60, 55-75th @ $70, 75th+ @ $80
 * And actual wRVUs = 8000 which is at 75th percentile in market data
 * Then apply $70 CF rate to all 8000 wRVUs
 */
function calculatePercentileTieredCF(
  wrvus: number,
  parameters: PercentileTieredCFParameters,
  basePay: number,
  fte: FTE,
  marketBenchmarks: MarketBenchmarks
): number {
  const { tiers } = parameters;
  
  if (tiers.length === 0) {
    throw new Error('Percentile-tiered CF model must have at least one tier');
  }

  // Normalize wRVUs for percentile calculation
  const normalizedWrvus = wrvus / (fte || 1.0);
  
  // Calculate what percentile this wRVU value is in the market data
  const wrvuPercentile = calculateWRVUPercentile(normalizedWrvus, marketBenchmarks);
  
  // Find which tier this percentile falls into
  let applicableTier = tiers[tiers.length - 1]; // Default to last tier
  
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const nextTier = tiers[i + 1];
    
    if (nextTier && tier.percentileThreshold !== undefined) {
      // Not the last tier - check if percentile falls in this range
      const tierStart = i === 0 ? 0 : (tiers[i - 1].percentileThreshold || 0);
      const tierEnd = tier.percentileThreshold;
      
      if (wrvuPercentile >= tierStart && wrvuPercentile < tierEnd) {
        applicableTier = tier;
        break;
      }
    } else {
      // Last tier - applies to all percentiles above previous threshold
      const tierStart = i === 0 ? 0 : (tiers[i - 1].percentileThreshold || 0);
      if (wrvuPercentile >= tierStart) {
        applicableTier = tier;
        break;
      }
    }
  }
  
  // Apply the CF rate from the applicable tier to all wRVUs
  const totalCompensation = wrvus * applicableTier.cf;
  
  return totalCompensation - basePay;
}

/**
 * Calculate incentive pay for Budget Neutral CF model
 * 
 * Adjusts CF so that projected TCC matches target percentile
 */
function calculateBudgetNeutralCF(
  wrvus: number,
  parameters: BudgetNeutralCFParameters,
  basePay: number,
  fte: FTE,
  marketBenchmarks: MarketBenchmarks
): number {
  const { targetTccPercentile, baseCF } = parameters;
  
  // Get target TCC value from percentile (this is normalized TCC)
  const normalizedTargetTcc = getTccValueFromPercentile(targetTccPercentile, marketBenchmarks);
  
  if (!normalizedTargetTcc || normalizedTargetTcc <= 0) {
    // Fallback to base CF if we can't determine target
    const fallbackCF = baseCF || 50;
    return calculateSingleCF(wrvus, { cf: fallbackCF }, basePay);
  }

  // Calculate required total compensation to hit target percentile
  // normalizedTargetTcc is already normalized to 1.0 FTE
  // We need to denormalize it to get the actual TCC for current FTE
  const requiredTotalTcc = normalizedTargetTcc * (fte || 1.0);
  
  // Calculate required incentive pay
  // TCC = Base Pay + Incentive Pay
  // Incentive Pay = TCC - Base Pay
  const requiredIncentivePay = requiredTotalTcc - basePay;
  
  // Calculate CF that would produce this incentive pay
  // incentivePay = (wRVUs * CF) - basePay
  // CF = (incentivePay + basePay) / wRVUs
  const calculatedCF = wrvus > 0 ? (requiredIncentivePay + basePay) / wrvus : 0;
  
  // Use calculated CF to get incentive pay (ensure CF is non-negative)
  return calculateSingleCF(wrvus, { cf: Math.max(0, calculatedCF) }, basePay);
}

/**
 * Get TCC value from percentile using market benchmarks
 */
function getTccValueFromPercentile(
  percentile: number,
  benchmarks: MarketBenchmarks
): number | null {
  const { tcc25, tcc50, tcc75, tcc90 } = benchmarks;
  
  // Interpolate between benchmarks
  if (percentile <= 25 && tcc25) {
    return tcc25 * (percentile / 25);
  } else if (percentile <= 50 && tcc25 && tcc50) {
    const ratio = (percentile - 25) / 25;
    return tcc25 + (tcc50 - tcc25) * ratio;
  } else if (percentile <= 75 && tcc50 && tcc75) {
    const ratio = (percentile - 50) / 25;
    return tcc50 + (tcc75 - tcc50) * ratio;
  } else if (percentile <= 90 && tcc75 && tcc90) {
    const ratio = (percentile - 75) / 15;
    return tcc75 + (tcc90 - tcc75) * ratio;
  } else if (percentile > 90 && tcc90) {
    // Extrapolate above 90th
    const ratio = (percentile - 90) / 10;
    return tcc90 * (1 + ratio * 0.3); // Assume 100th is 30% above 90th
  }
  
  return null;
}

/**
 * Calculate incentive pay for Quality Weighted CF model
 */
function calculateQualityWeightedCF(
  wrvus: number,
  parameters: QualityWeightedCFParameters,
  basePay: number
): number {
  const { baseCF, qualityScore } = parameters;
  
  // Normalize quality score to 0-1.0 range
  const normalizedQuality = qualityScore > 1 ? qualityScore / 100 : qualityScore;
  const qualityMultiplier = Math.max(0, Math.min(1, normalizedQuality));
  
  // Apply quality multiplier to base CF
  const effectiveCF = baseCF * qualityMultiplier;
  
  return calculateSingleCF(wrvus, { cf: effectiveCF }, basePay);
}

/**
 * Calculate incentive pay for FTE Adjusted CF model
 */
function calculateFTEAdjustedCF(
  wrvus: number,
  parameters: FTEAdjustedCFParameters,
  basePay: number,
  fte: FTE
): number {
  const { tiers } = parameters;
  
  // Find the appropriate tier for current FTE
  // For the last tier, fteMax should be inclusive (typically 1.0)
  const applicableTier = tiers.find((tier, index) => {
    const isLastTier = index === tiers.length - 1;
    if (isLastTier) {
      return fte >= tier.fteMin && (tier.fteMax === undefined || fte <= tier.fteMax);
    }
    return fte >= tier.fteMin && (tier.fteMax === undefined || fte < tier.fteMax);
  }) || tiers[tiers.length - 1]; // Fallback to last tier
  
  if (!applicableTier) {
    throw new Error('No applicable FTE tier found');
  }
  
  // Use the CF from the applicable tier
  return calculateSingleCF(wrvus, { cf: applicableTier.cf }, basePay);
}

/**
 * Generate a human-readable summary of a CF model
 */
export function getCFModelSummary(model: ConversionFactorModel): string {
  switch (model.modelType) {
    case 'single': {
      const params = model.parameters as SingleCFParameters;
      return `Single CF: $${params.cf.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/wRVU`;
    }
    case 'tiered': {
      const params = model.parameters as TieredCFParameters;
      const parts: string[] = [];
      let previousThreshold = 0;
      
      for (let i = 0; i < params.tiers.length; i++) {
        const tier = params.tiers[i];
        const nextTier = params.tiers[i + 1];
        
        if (nextTier && tier.threshold !== undefined) {
          if (params.tierType === 'threshold') {
            const thresholdK = tier.threshold >= 1000 ? `${tier.threshold / 1000}K` : tier.threshold.toString();
            const prevK = previousThreshold >= 1000 ? `${previousThreshold / 1000}K` : previousThreshold.toString();
            parts.push(`${prevK}-${thresholdK} @ $${tier.cf.toFixed(2)}`);
            previousThreshold = tier.threshold;
          } else {
            parts.push(`${previousThreshold}%-${tier.threshold}% @ $${tier.cf.toFixed(2)}`);
            previousThreshold = tier.threshold;
          }
        } else {
          if (params.tierType === 'threshold') {
            const prevK = previousThreshold >= 1000 ? `${previousThreshold / 1000}K+` : `${previousThreshold}+`;
            parts.push(`${prevK} @ $${tier.cf.toFixed(2)}`);
          } else {
            parts.push(`${previousThreshold}%+ @ $${tier.cf.toFixed(2)}`);
          }
        }
      }
      
      return `Tiered: ${parts.join('; ')}`;
    }
    case 'budget-neutral': {
      const params = model.parameters as BudgetNeutralCFParameters;
      return `Budget Neutral: Target ${params.targetTccPercentile}th percentile`;
    }
    case 'quality-weighted': {
      const params = model.parameters as QualityWeightedCFParameters;
      const qualityPercent = params.qualityScore > 1 
        ? params.qualityScore 
        : params.qualityScore * 100;
      return `Quality Weighted: $${params.baseCF.toFixed(2)} base @ ${qualityPercent.toFixed(0)}% quality`;
    }
    case 'percentile-tiered': {
      const params = model.parameters as PercentileTieredCFParameters;
      const parts: string[] = [];
      let previousThreshold = 0;
      
      for (let i = 0; i < params.tiers.length; i++) {
        const tier = params.tiers[i];
        const nextTier = params.tiers[i + 1];
        
        if (nextTier && tier.percentileThreshold !== undefined) {
          parts.push(`${previousThreshold}-${tier.percentileThreshold}th @ $${tier.cf.toFixed(2)}`);
          previousThreshold = tier.percentileThreshold;
        } else {
          parts.push(`${previousThreshold}th+ @ $${tier.cf.toFixed(2)}`);
        }
      }
      
      return `Percentile Tiered: ${parts.join('; ')}`;
    }
    case 'fte-adjusted': {
      const params = model.parameters as FTEAdjustedCFParameters;
      const parts = params.tiers.map((tier, i) => {
        if (i === 0 && tier.fteMin === 0) {
          return `<${tier.fteMax} @ $${tier.cf.toFixed(2)}`;
        } else if (i === params.tiers.length - 1) {
          return `>${tier.fteMin} @ $${tier.cf.toFixed(2)}`;
        } else {
          return `${tier.fteMin}-${tier.fteMax} @ $${tier.cf.toFixed(2)}`;
        }
      });
      return `FTE Adjusted: ${parts.join('; ')}`;
    }
    default:
      return 'Unknown CF Model';
  }
}

