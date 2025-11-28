/**
 * Types for Internal Benchmark Engine
 */

import { MarketBenchmarks } from '@/types';

/**
 * Provider Record from uploaded data
 */
export interface ProviderRecord {
  id: string;
  name: string;
  fte: number; // Clinical FTE (0-1.0)
  wrvus: number; // Annual wRVUs
  tcc: number; // Total Cash Compensation
  notes?: string; // Optional notes
}

/**
 * Internal Percentiles calculated from provider data
 */
export interface InternalPercentiles {
  wrvu25: number;
  wrvu50: number;
  wrvu75: number;
  wrvu90: number;
  tcc25: number;
  tcc50: number;
  tcc75: number;
  tcc90: number;
}

/**
 * Blending Mode
 */
export type BlendingMode = 'survey-only' | 'internal-only' | 'blended';

/**
 * Blending Weights
 */
export interface BlendingWeights {
  internalWeight: number; // 0-1.0
  surveyWeight: number; // 0-1.0, should equal 1.0 - internalWeight
}

/**
 * Blended Benchmarks
 */
export interface BlendedBenchmarks {
  mode: BlendingMode;
  weights?: BlendingWeights;
  wrvu25: number;
  wrvu50: number;
  wrvu75: number;
  wrvu90: number;
  tcc25: number;
  tcc50: number;
  tcc75: number;
  tcc90: number;
}

/**
 * CF Recommendation
 */
export interface CFRecommendation {
  minCF: number;
  maxCF: number;
  medianCF: number;
  justification: string;
  commentary: string;
  modelYear: number;
}

/**
 * Comparison Metrics
 */
export interface ComparisonMetrics {
  wrvuDifference: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  tccDifference: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  wrvuPercentDifference: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  tccPercentDifference: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
}


