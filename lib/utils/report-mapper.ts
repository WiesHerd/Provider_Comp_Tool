/**
 * Report Mapper
 * 
 * Pure functions to map CallScenario to report data structures
 */

import { CallScenario } from '@/types/call-scenarios';
import { ScenarioReportData, ScenarioComparisonReportData } from '@/types/report';

/**
 * Map a CallScenario to ScenarioReportData
 */
export function mapScenarioToReportData(scenario: CallScenario): ScenarioReportData {
  const totalEligibleFTE = scenario.providers
    .filter(p => p.eligibleForCall)
    .reduce((sum, p) => sum + p.fte, 0);
  
  const eligibleProviderCount = scenario.providers.filter(p => p.eligibleForCall).length;

  return {
    scenario,
    totalAnnualCallBudget: scenario.budgetResult.totalAnnualCallBudget,
    callPayPerFTE: scenario.budgetResult.callPayPerFTE,
    effectivePer24h: scenario.budgetResult.effectivePer24h,
    fairnessScore: scenario.burdenSummary?.fairnessScore,
    fmvRiskLevel: scenario.fmvSummary?.riskLevel,
    fmvPercentileEstimate: scenario.fmvSummary?.percentileEstimate,
    fmvNarrative: scenario.fmvSummary ? generateFMVNarrativeFromSummary(scenario) : undefined,
    specialty: scenario.program.specialty,
    modelYear: scenario.program.modelYear,
    serviceLine: scenario.program.serviceLine,
    providersOnCall: scenario.program.providersOnCall,
    totalEligibleFTE,
    eligibleProviderCount,
  };
}

/**
 * Map multiple scenarios to comparison report data
 */
export function mapScenariosToComparisonReportData(
  scenarios: CallScenario[]
): ScenarioComparisonReportData {
  return {
    scenarios: scenarios.map(mapScenarioToReportData),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate FMV narrative from scenario summary
 * This is a simplified version - in production, you might want to store the full narrative
 */
function generateFMVNarrativeFromSummary(scenario: CallScenario): string {
  if (!scenario.fmvSummary) {
    return '';
  }

  const { riskLevel, percentileEstimate, effectiveRatePer24h } = scenario.fmvSummary;
  const specialty = scenario.program.specialty;
  const activeTier = scenario.tiers.find(t => t.enabled) || scenario.tiers[0];
  const coverageType = activeTier?.coverageType || 'In-house';

  let narrative = `Based on market benchmark data for ${specialty} with ${coverageType} coverage, `;
  
  if (percentileEstimate !== undefined) {
    narrative += `the effective rate of $${effectiveRatePer24h.toLocaleString()} per 24-hour period falls approximately at the ${percentileEstimate}th percentile. `;
  } else {
    narrative += `the effective rate of $${effectiveRatePer24h.toLocaleString()} per 24-hour period `;
  }

  if (scenario.burdenSummary?.fairnessScore !== undefined) {
    const burdenScore = scenario.burdenSummary.fairnessScore;
    if (burdenScore >= 80) {
      narrative += `The arrangement includes high call burden (fairness score: ${burdenScore}), which supports the compensation level. `;
    } else if (burdenScore < 60) {
      narrative += `The arrangement includes relatively low call burden (fairness score: ${burdenScore}). `;
    }
  }

  if (riskLevel === 'LOW') {
    narrative += `This rate appears reasonable and consistent with market FMV ranges.`;
  } else if (riskLevel === 'MODERATE') {
    narrative += `This rate may warrant additional review or documentation to support FMV compliance.`;
  } else {
    narrative += `This rate may be considered above typical FMV and requires formal valuation and comprehensive documentation to support compliance.`;
  }

  return narrative;
}





