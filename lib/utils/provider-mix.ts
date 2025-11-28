/**
 * Provider Mix Utilities
 * 
 * Functions for provider-level compensation calculations
 * All calculations reuse existing Phase 1-3 logic
 */

import {
  Provider,
  ProviderAnalysis,
  ProviderProfile,
  GroupSummary,
} from '@/types/provider-mix';
import { ConversionFactorModel } from '@/types/cf-models';
import { MarketBenchmarks, FTE } from '@/types';
import {
  calculateIncentivePayWithModel,
} from './cf-model-engine';
import {
  calculateWRVUPercentile,
  calculateTCCPercentile,
} from './percentile';
import { normalizeTcc } from './normalization';
import { getAlignmentStatus } from './scenario-modeling';

/**
 * Calculate clinical CF compensation
 * Only clinical FTE enters CF modeling
 */
export function calculateClinicalCF(
  wrvus: number,
  cfModel: ConversionFactorModel,
  basePay: number,
  clinicalFTE: FTE,
  marketBenchmarks: MarketBenchmarks
): number {
  // Calculate incentive pay using CF model (applies to full wRVUs)
  const fullIncentivePay = calculateIncentivePayWithModel(
    wrvus,
    cfModel,
    basePay,
    clinicalFTE,
    marketBenchmarks
  );

  // Clinical incentive pay is prorated by clinical FTE
  // Base pay portion is also prorated
  const clinicalBasePay = basePay * clinicalFTE;
  const clinicalIncentivePay = fullIncentivePay * clinicalFTE;

  // Total clinical compensation
  return clinicalBasePay + Math.max(0, clinicalIncentivePay);
}

/**
 * Calculate non-clinical compensation
 * Supports manual input or formula-based calculation
 */
export function calculateNonClinicalCompensation(
  provider: Provider,
  basePay: number
): number {
  if (!provider.nonClinicalCompensation) {
    return 0;
  }

  const config = provider.nonClinicalCompensation;

  switch (config.calculationMethod) {
    case 'manual':
      return config.manualAmount || 0;

    case 'formula-admin-fte':
      // Admin FTE × Base Salary
      return provider.adminFTE * basePay;

    case 'formula-stipend':
      // Fixed stipend amount
      return config.stipendAmount || 0;

    case 'role-based':
      // Role-based stipend
      return config.roleStipendAmount || 0;

    default:
      return 0;
  }
}

/**
 * Calculate total TCC for a provider
 * Includes clinical compensation, non-clinical compensation, and optionally call pay
 */
export function calculateProviderTCC(
  provider: Provider,
  wrvus: number,
  cfModel: ConversionFactorModel,
  basePay: number,
  marketBenchmarks: MarketBenchmarks,
  includeCallPay: boolean = false
): {
  clinicalIncentivePay: number;
  clinicalBasePay: number;
  nonClinicalComp: number;
  callPayAmount: number;
  totalTCC: number;
} {
  // Clinical compensation (CF-based)
  const clinicalBasePay = basePay * provider.clinicalFTE;
  const fullIncentivePay = calculateIncentivePayWithModel(
    wrvus,
    cfModel,
    basePay,
    provider.clinicalFTE,
    marketBenchmarks
  );
  const clinicalIncentivePay = fullIncentivePay * provider.clinicalFTE;

  // Non-clinical compensation
  const nonClinicalComp = calculateNonClinicalCompensation(provider, basePay);

  // Call pay (if applicable and included)
  const callPayAmount = includeCallPay && provider.callBurden ? (provider.callPay || 0) : 0;

  // Total TCC
  const totalTCC =
    clinicalBasePay +
    Math.max(0, clinicalIncentivePay) +
    nonClinicalComp +
    callPayAmount;

  return {
    clinicalIncentivePay: Math.max(0, clinicalIncentivePay),
    clinicalBasePay,
    nonClinicalComp,
    callPayAmount,
    totalTCC,
  };
}

/**
 * Calculate provider-level analysis
 * Includes percentile calculations and alignment status
 */
export function calculateProviderAnalysis(
  provider: Provider,
  wrvus: number,
  cfModel: ConversionFactorModel,
  basePay: number,
  marketBenchmarks: MarketBenchmarks,
  includeCallPay: boolean = false
): ProviderAnalysis {
  // Calculate TCC components
  const tccBreakdown = calculateProviderTCC(
    provider,
    wrvus,
    cfModel,
    basePay,
    marketBenchmarks,
    includeCallPay
  );

  // Normalize TCC by clinical FTE for percentile comparison
  // This ensures fair comparison - we're comparing clinical productivity to clinical compensation
  const normalizedTCC = normalizeTcc(tccBreakdown.totalTCC, provider.clinicalFTE);

  // Normalize wRVUs by clinical FTE
  const normalizedWrvus = wrvus / (provider.clinicalFTE || 1.0);

  // Calculate percentiles
  const wrvuPercentile = calculateWRVUPercentile(normalizedWrvus, marketBenchmarks);
  const tccPercentile = calculateTCCPercentile(normalizedTCC, marketBenchmarks);

  // Calculate alignment status
  const alignmentStatus = getAlignmentStatus(wrvuPercentile, tccPercentile);

  // Determine risk flag
  const riskFlag: 'Aligned' | 'Mild Drift' | 'Risk Zone' = alignmentStatus;

  // Identify risk factors
  const riskFactors: string[] = [];
  if (tccPercentile >= wrvuPercentile + 15) {
    riskFactors.push(
      `TCC percentile (${Math.round(tccPercentile)}th) significantly exceeds wRVU percentile (${Math.round(wrvuPercentile)}th)`
    );
  }
  if (provider.adminFTE > 0.3) {
    riskFactors.push(`High admin FTE (${(provider.adminFTE * 100).toFixed(0)}%) may impact clinical productivity expectations`);
  }
  if (tccPercentile > 90) {
    riskFactors.push(`TCC exceeds 90th percentile - potential FMV concern`);
  }

  return {
    provider,
    clinicalIncentivePay: tccBreakdown.clinicalIncentivePay,
    nonClinicalComp: tccBreakdown.nonClinicalComp,
    callPayAmount: tccBreakdown.callPayAmount,
    totalTCC: tccBreakdown.totalTCC,
    normalizedTCC,
    wrvuPercentile,
    tccPercentile,
    alignmentStatus,
    riskFlag,
    riskFactors: riskFactors.length > 0 ? riskFactors : undefined,
  };
}

/**
 * Generate provider profile for export
 */
export function generateProviderProfile(
  provider: Provider,
  analysis: ProviderAnalysis,
  specialty: string,
  modelYear: number,
  cfModel: ConversionFactorModel,
  basePay: number
): ProviderProfile {
  // Determine FMV risk level
  let fmvRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (analysis.tccPercentile >= analysis.wrvuPercentile + 15 || analysis.tccPercentile > 90) {
    fmvRiskLevel = 'HIGH';
  } else if (analysis.tccPercentile >= analysis.wrvuPercentile + 10 || analysis.tccPercentile > 75) {
    fmvRiskLevel = 'MEDIUM';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (analysis.riskFlag === 'Risk Zone') {
    recommendations.push(
      'Review CF model - significant misalignment detected. Consider adjusting CF or provider expectations before implementation.'
    );
  } else if (analysis.riskFlag === 'Mild Drift') {
    recommendations.push(
      'Monitor annual productivity before raising CF further. Consider FTE adjustment if expectations misalign.'
    );
  }

  if (provider.adminFTE > 0.2) {
    recommendations.push(
      `Ensure clinical productivity expectations account for ${(provider.adminFTE * 100).toFixed(0)}% admin FTE.`
    );
  }

  if (analysis.tccPercentile > 75) {
    recommendations.push(
      'TCC exceeds 75th percentile - document justification for above-market compensation.'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('Compensation model appears aligned with productivity levels.');
  }

  return {
    provider,
    analysis,
    specialty,
    modelYear,
    cfModel,
    basePay,
    recommendations,
    fmvRiskLevel,
  };
}

/**
 * Calculate group-level summary
 */
export function calculateGroupSummary(
  providers: Provider[],
  analyses: ProviderAnalysis[],
  cfModel: ConversionFactorModel
): GroupSummary {
  if (providers.length === 0) {
    return {
      totalProviders: 0,
      averageClinicalFTE: 0,
      averageAdminFTE: 0,
      providersAtRisk: 0,
      averageTCC: 0,
      weightedAverageCF: 0,
    };
  }

  const totalClinicalFTE = providers.reduce((sum, p) => sum + p.clinicalFTE, 0);
  const totalAdminFTE = providers.reduce((sum, p) => sum + p.adminFTE, 0);
  const providersAtRisk = analyses.filter((a) => a.riskFlag === 'Risk Zone').length;
  const totalTCC = analyses.reduce((sum, a) => sum + a.totalTCC, 0);

  // Calculate weighted average CF
  // This is a simplified calculation - in reality, CF varies by wRVU tier
  // For now, we'll use the CF model summary to extract a representative CF value
  let weightedAverageCF = 0;
  
  // Extract CF value from summary (for single CF models)
  if (cfModel.modelType === 'single') {
    weightedAverageCF = (cfModel.parameters as { cf: number }).cf;
  } else {
    // For other models, use a representative value (could be enhanced)
    weightedAverageCF = 50; // Default placeholder
  }

  return {
    totalProviders: providers.length,
    averageClinicalFTE: totalClinicalFTE / providers.length,
    averageAdminFTE: totalAdminFTE / providers.length,
    providersAtRisk,
    averageTCC: totalTCC / providers.length,
    weightedAverageCF,
  };
}


