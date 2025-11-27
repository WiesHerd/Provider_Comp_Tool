/**
 * Burden & Fairness Calculations
 * 
 * Pure functions for calculating expected call burden per provider
 * and fairness metrics based on FTE distribution.
 */

import { CallProvider, CallAssumptions } from '@/types/call-pay-engine';

/**
 * Result for a single provider's expected burden
 */
export interface ProviderBurdenResult {
  providerId: string;
  providerName?: string;
  fte: number;
  expectedWeekdayCalls: number;
  expectedWeekendCalls: number;
  expectedHolidayCalls: number;
  totalExpectedCalls: number;
  burdenIndex: number; // Percentage deviation from group average
}

/**
 * Group-level fairness metrics
 */
export interface FairnessSummary {
  groupAverageCalls: number;
  minCalls: number;
  maxCalls: number;
  averageCalls: number; // Same as groupAverageCalls, kept for clarity
  standardDeviation: number;
  fairnessScore: number; // 0-100, higher is more fair
  totalEligibleFTE: number;
  eligibleProviderCount: number;
}

/**
 * Calculate expected call burden for each eligible provider
 */
export function calculateExpectedBurden(
  providers: CallProvider[],
  assumptions: CallAssumptions
): ProviderBurdenResult[] {
  // Filter to only eligible providers
  const eligibleProviders = providers.filter(p => p.eligibleForCall);
  
  if (eligibleProviders.length === 0) {
    return [];
  }

  // Calculate total annual calls
  const totalWeekdayCalls = assumptions.weekdayCallsPerMonth * 12;
  const totalWeekendCalls = assumptions.weekendCallsPerMonth * 12;
  const totalHolidayCalls = assumptions.holidaysPerYear;
  const totalCalls = totalWeekdayCalls + totalWeekendCalls + totalHolidayCalls;

  // Sum FTE of eligible providers
  const totalEligibleFTE = eligibleProviders.reduce((sum, p) => sum + p.fte, 0);

  if (totalEligibleFTE === 0) {
    return eligibleProviders.map(p => ({
      providerId: p.id,
      providerName: p.name,
      fte: p.fte,
      expectedWeekdayCalls: 0,
      expectedWeekendCalls: 0,
      expectedHolidayCalls: 0,
      totalExpectedCalls: 0,
      burdenIndex: 0,
    }));
  }

  // Calculate group average (for burden index calculation)
  const groupAverageCalls = totalCalls / eligibleProviders.length;

  // Calculate expected calls for each provider based on FTE share
  const burdenResults: ProviderBurdenResult[] = eligibleProviders.map(provider => {
    const providerShare = provider.fte / totalEligibleFTE;
    
    const expectedWeekdayCalls = totalWeekdayCalls * providerShare;
    const expectedWeekendCalls = totalWeekendCalls * providerShare;
    const expectedHolidayCalls = totalHolidayCalls * providerShare;
    const totalExpectedCalls = expectedWeekdayCalls + expectedWeekendCalls + expectedHolidayCalls;

    // Burden index: percentage deviation from group average
    // Positive = above average, Negative = below average
    const burdenIndex = groupAverageCalls > 0
      ? ((totalExpectedCalls - groupAverageCalls) / groupAverageCalls) * 100
      : 0;

    return {
      providerId: provider.id,
      providerName: provider.name,
      fte: provider.fte,
      expectedWeekdayCalls,
      expectedWeekendCalls,
      expectedHolidayCalls,
      totalExpectedCalls,
      burdenIndex,
    };
  });

  return burdenResults;
}

/**
 * Calculate group-level fairness metrics from burden results
 */
export function calculateFairnessMetrics(
  burdenResults: ProviderBurdenResult[]
): FairnessSummary {
  if (burdenResults.length === 0) {
    return {
      groupAverageCalls: 0,
      minCalls: 0,
      maxCalls: 0,
      averageCalls: 0,
      standardDeviation: 0,
      fairnessScore: 100, // Perfect fairness if no providers
      totalEligibleFTE: 0,
      eligibleProviderCount: 0,
    };
  }

  const totalCalls = burdenResults.reduce((sum, r) => sum + r.totalExpectedCalls, 0);
  const groupAverageCalls = totalCalls / burdenResults.length;
  const totalEligibleFTE = burdenResults.reduce((sum, r) => sum + r.fte, 0);

  // Calculate min and max
  const calls = burdenResults.map(r => r.totalExpectedCalls);
  const minCalls = Math.min(...calls);
  const maxCalls = Math.max(...calls);

  // Calculate standard deviation
  const variance = burdenResults.reduce((sum, r) => {
    const diff = r.totalExpectedCalls - groupAverageCalls;
    return sum + (diff * diff);
  }, 0) / burdenResults.length;
  const standardDeviation = Math.sqrt(variance);

  // Calculate fairness score (0-100)
  // Lower variance = higher fairness score
  // If all providers have the same calls, score = 100
  // Score decreases as standard deviation increases relative to average
  let fairnessScore = 100;
  if (groupAverageCalls > 0) {
    const coefficientOfVariation = standardDeviation / groupAverageCalls;
    // Map CV to 0-100 scale (CV of 0 = 100, CV of 0.5+ = 0)
    fairnessScore = Math.max(0, Math.min(100, 100 * (1 - coefficientOfVariation * 2)));
  }

  return {
    groupAverageCalls,
    minCalls,
    maxCalls,
    averageCalls: groupAverageCalls,
    standardDeviation,
    fairnessScore: Math.round(fairnessScore * 10) / 10, // Round to 1 decimal
    totalEligibleFTE,
    eligibleProviderCount: burdenResults.length,
  };
}


