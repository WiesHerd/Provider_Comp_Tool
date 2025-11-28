/**
 * Types for Provider Mix & FTE Role Logic
 */

import { AlignmentStatus } from '@/types/physician-scenarios';
import { ConversionFactorModel } from '@/types/cf-models';

/**
 * Provider Role Types
 */
export type ProviderRole = 'Core PCP' | 'Lead' | 'Academic' | 'Part-time' | 'Other';

/**
 * Non-Clinical Compensation Configuration
 */
export interface NonClinicalCompensation {
  providerId: string;
  calculationMethod: 'manual' | 'formula-admin-fte' | 'formula-stipend' | 'role-based';
  manualAmount?: number; // Used if calculationMethod is 'manual'
  stipendAmount?: number; // Used if calculationMethod is 'formula-stipend'
  roleStipendAmount?: number; // Used if calculationMethod is 'role-based'
}

/**
 * Provider Configuration
 */
export interface Provider {
  id: string;
  name: string;
  role: ProviderRole;
  clinicalFTE: number; // 0-1.0, required
  adminFTE: number; // 0-1.0, clinical + admin ≤ 1.0
  callBurden: boolean; // Whether provider has call burden
  actualWrvus?: number; // Optional actual wRVUs, if not provided use median from benchmarks
  notes?: string; // Optional notes
  callPay?: number; // Optional call pay amount (if call burden is true)
  nonClinicalCompensation?: NonClinicalCompensation;
}

/**
 * Provider Analysis Result
 */
export interface ProviderAnalysis {
  provider: Provider;
  clinicalIncentivePay: number; // CF-based incentive pay (clinical FTE only)
  nonClinicalComp: number; // Non-clinical compensation
  callPayAmount: number; // Call pay (if applicable and included)
  totalTCC: number; // Total TCC = basePay × clinicalFTE + clinicalIncentivePay + nonClinicalComp + callPay
  normalizedTCC: number; // TCC normalized by clinical FTE for percentile comparison
  wrvuPercentile: number; // wRVU percentile from benchmarks
  tccPercentile: number; // TCC percentile from benchmarks
  alignmentStatus: AlignmentStatus;
  riskFlag: 'Aligned' | 'Mild Drift' | 'Risk Zone';
  riskFactors?: string[]; // List of risk factors/concerns
}

/**
 * Provider Profile for Export
 */
export interface ProviderProfile {
  provider: Provider;
  analysis: ProviderAnalysis;
  specialty: string;
  modelYear: number;
  cfModel: ConversionFactorModel;
  basePay: number;
  recommendations: string[]; // Actionable recommendations
  fmvRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Group-Level Summary
 */
export interface GroupSummary {
  totalProviders: number;
  averageClinicalFTE: number;
  averageAdminFTE: number;
  providersAtRisk: number; // Count of providers with Risk Zone status
  averageTCC: number;
  weightedAverageCF: number; // Weighted by clinical FTE
  totalBudgetImpact?: number; // If comparing current vs proposed CF
}


