/**
 * Types for Physician Scenario Explorer
 */

export type AlignmentStatus = 'Aligned' | 'Mild Drift' | 'Risk Zone';

import { MarketBenchmarks } from '@/types';

export interface ProductivityScenario {
  id: string;
  name: string;
  wrvus: number;
  fixedComp?: number; // Fixed compensation (base, call, etc. that belongs in TCC)
  marketBenchmarks?: MarketBenchmarks; // Market survey data for this scenario (wRVU, CF, TCC percentiles)
  useActualProductivity: boolean; // Checkbox for baseline scenario
}

export type FMVRiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface ScenarioResult {
  scenario: ProductivityScenario;
  cfModelType: string; // CF model type for display
  cfModelSummary: string; // Human-readable CF model summary
  wrvuPercentile: number;
  effectiveCF: number; // Clinical TCC / wRVUs
  incentivePay: number; // (wRVUs * CF) - basePay
  clinicalDollars: number; // Clinical dollars from CF model
  modeledTcc: number; // Fixed comp + clinical dollars
  surveyTCC: number; // Full TCC (Base + Productivity) - kept for backward compatibility
  tccPercentile: number;
  cfPercentile?: number; // CF percentile (if CF market data provided)
  alignmentStatus: AlignmentStatus;
  recommendedCF?: number | null; // Recommended CF (flat equivalent) to achieve alignment
  fmvRiskLevel?: FMVRiskLevel; // FMV compliance risk level based on absolute TCC percentile
}

