/**
 * Executive Report Types
 * 
 * Types for executive/board-ready reports
 */

import { CallScenario } from './call-scenarios';
import { FMVRiskLevel } from './fmv';

/**
 * Report data for a single scenario
 */
export interface ScenarioReportData {
  scenario: CallScenario;
  
  // Flattened key metrics for easy access
  totalAnnualCallBudget: number;
  callPayPerFTE: number;
  effectivePer24h: number;
  fairnessScore?: number;
  fmvRiskLevel?: FMVRiskLevel;
  fmvPercentileEstimate?: number;
  fmvNarrative?: string;
  
  // Additional context
  specialty: string;
  modelYear: number;
  serviceLine?: string;
  providersOnCall: number;
  totalEligibleFTE: number;
  eligibleProviderCount: number;
}

/**
 * Report data for scenario comparison
 */
export interface ScenarioComparisonReportData {
  scenarios: ScenarioReportData[];
  generatedAt: string; // ISO timestamp
}





