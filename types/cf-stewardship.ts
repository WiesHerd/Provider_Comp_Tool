/**
 * Types for CF Stewardship Dashboard
 */

import { AlignmentStatus } from '@/types/physician-scenarios';
import { ConversionFactorModel } from '@/types/cf-models';

/**
 * Stewardship Scenario
 * Represents a productivity scenario used in stewardship comparison
 */
export interface StewardshipScenario {
  id: string;
  name: string; // e.g., "25th Percentile", "50th Percentile", "Current Actual"
  wrvus: number; // wRVU value for this scenario
  percentile: number; // wRVU percentile (25, 50, 75, 90)
  isActual?: boolean; // True if this is "Current Actual" scenario
}

/**
 * Stewardship Comparison Result
 * Compares current vs proposed CF for a single scenario
 */
export interface StewardshipComparison {
  scenario: StewardshipScenario;
  // Current CF results
  currentIncentivePay: number;
  currentSurveyTCC: number;
  currentTccPercentile: number;
  currentAlignmentStatus: AlignmentStatus;
  // Proposed CF results
  proposedIncentivePay: number;
  proposedSurveyTCC: number;
  proposedTccPercentile: number;
  proposedAlignmentStatus: AlignmentStatus;
  // Comparison metrics
  percentileMatch: number; // Difference: proposedTccPercentile - wrvuPercentile
  alignmentStatus: AlignmentStatus; // Overall alignment for proposed CF
}

/**
 * CF Proposal
 * Represents a proposed CF change
 */
export interface CFProposal {
  currentCFModel: ConversionFactorModel;
  proposedCFModel: ConversionFactorModel;
  adjustmentType: 'manual' | 'percentage';
  adjustmentPercent?: number; // Only used if adjustmentType is 'percentage'
}

/**
 * Budget Impact Calculation
 */
export interface BudgetImpact {
  medianWrvus: number;
  providerCount: number;
  currentTCCPerFTE: number;
  proposedTCCPerFTE: number;
  deltaPerFTE: number;
  totalBudgetImpact: number;
  averageProviderImpact: number;
}

/**
 * Market Movement Data
 * Tracks year-over-year changes in market benchmarks
 */
export interface MarketMovement {
  tccMedianChange?: number; // % change in TCC median
  wrvuMedianChange?: number; // % change in wRVU median
  lastYearTccMedian?: number;
  currentYearTccMedian?: number;
  lastYearWrvuMedian?: number;
  currentYearWrvuMedian?: number;
}

