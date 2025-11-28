/**
 * Conversion Factor Model Types
 * 
 * Defines the structure for different CF model types and their parameters
 */

export type CFModelType = 'single' | 'tiered' | 'percentile-tiered' | 'budget-neutral' | 'quality-weighted' | 'fte-adjusted';

export type TierType = 'threshold' | 'percentage';

/**
 * Single CF Parameters
 */
export interface SingleCFParameters {
  cf: number;
}

/**
 * Tiered CF Tier Definition
 */
export interface TieredCFTier {
  threshold?: number; // wRVU threshold (for threshold-based) or percentage threshold (for percentage-based)
  cf: number; // Conversion factor for this tier
}

/**
 * Tiered CF Parameters
 */
export interface TieredCFParameters {
  tierType: TierType; // 'threshold' or 'percentage'
  tiers: TieredCFTier[]; // Array of tiers, last tier has no threshold (applies to remainder)
}

/**
 * Budget Neutral CF Parameters
 */
export interface BudgetNeutralCFParameters {
  targetTccPercentile: number; // Target TCC percentile (e.g., 50 for 50th percentile)
  baseCF?: number; // Optional starting CF for calculation
}

/**
 * Quality Weighted CF Parameters
 */
export interface QualityWeightedCFParameters {
  baseCF: number;
  qualityScore: number; // 0-1.0 or 0-100 (will be normalized to 0-1.0)
}

/**
 * FTE Adjusted CF Tier
 */
export interface FTEAdjustedTier {
  fteMin: number; // Minimum FTE (inclusive)
  fteMax: number; // Maximum FTE (exclusive, except for last tier)
  cf: number; // Conversion factor for this FTE range
}

/**
 * FTE Adjusted CF Parameters
 */
export interface FTEAdjustedCFParameters {
  tiers: FTEAdjustedTier[];
}

/**
 * Percentile-Based Tiered CF Tier
 * Tiers are defined by productivity percentiles (not raw wRVU values)
 */
export interface PercentileTieredCFTier {
  percentileThreshold?: number; // Percentile threshold (e.g., 33, 55, 75) - last tier has no threshold
  cf: number; // Conversion factor for this percentile range
}

/**
 * Percentile-Based Tiered CF Parameters
 * Tiers are keyed off wRVU percentile in market data, not raw wRVU values
 */
export interface PercentileTieredCFParameters {
  tiers: PercentileTieredCFTier[]; // Array of tiers, last tier has no threshold (applies to remainder)
}

/**
 * Union type for all CF model parameters
 */
export type CFModelParameters =
  | SingleCFParameters
  | TieredCFParameters
  | PercentileTieredCFParameters
  | BudgetNeutralCFParameters
  | QualityWeightedCFParameters
  | FTEAdjustedCFParameters;

/**
 * Conversion Factor Model
 * 
 * Represents a complete CF model configuration
 */
export interface ConversionFactorModel {
  modelType: CFModelType;
  parameters: CFModelParameters;
}

/**
 * Saved CF Model
 * 
 * Represents a saved CF model with context and results
 */
export interface SavedCFModel {
  id: string;
  name: string;
  model: ConversionFactorModel;
  // Context data
  specialty?: string;
  fte: number;
  wrvus: number;
  tccComponents: import('./index').TCCComponent[];
  marketBenchmarks: import('./index').MarketBenchmarks;
  // Results (calculated when saved)
  results?: {
    wrvuPercentile: number;
    tccPercentile: number;
    cfPercentile: number | null;
    modeledTcc: number;
    clinicalDollars: number;
    effectiveCF: number;
    alignmentStatus: 'Aligned' | 'Mild Drift' | 'Risk Zone';
    alignmentDelta: number;
    fmvRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | null;
  };
  createdAt: string;
  updatedAt: string;
}

