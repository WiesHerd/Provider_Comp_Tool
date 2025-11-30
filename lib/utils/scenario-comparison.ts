/**
 * Scenario Comparison Utilities
 * Compare multiple call pay scenarios side-by-side
 */

import {
  CallPayContext,
  CallTier,
  CallPayImpact,
} from '@/types/call-pay';

export interface ScenarioData {
  id: string;
  name: string;
  context: CallPayContext;
  tiers: CallTier[];
  impact: CallPayImpact;
}

export interface ComparisonVariance {
  field: string;
  scenario1Value: number | string;
  scenario2Value: number | string;
  variance: number;
  variancePercent: number;
}

export interface ScenarioComparison {
  scenarios: ScenarioData[];
  variances: ComparisonVariance[];
  totalBudgetVariance: number;
  totalBudgetVariancePercent: number;
  averagePayVariance: number;
  averagePayVariancePercent: number;
}

/**
 * Compare two scenarios
 */
export function compareScenarios(
  scenario1: ScenarioData,
  scenario2: ScenarioData
): ScenarioComparison {
  const variances: ComparisonVariance[] = [];

  // Compare total annual call spend
  const budgetVariance = scenario2.impact.totalAnnualCallSpend - scenario1.impact.totalAnnualCallSpend;
  const budgetVariancePercent = scenario1.impact.totalAnnualCallSpend > 0
    ? (budgetVariance / scenario1.impact.totalAnnualCallSpend) * 100
    : 0;

  variances.push({
    field: 'Total Annual Call Budget',
    scenario1Value: scenario1.impact.totalAnnualCallSpend,
    scenario2Value: scenario2.impact.totalAnnualCallSpend,
    variance: budgetVariance,
    variancePercent: budgetVariancePercent,
  });

  // Compare average call pay per provider
  const avgPayVariance = scenario2.impact.averageCallPayPerProvider - scenario1.impact.averageCallPayPerProvider;
  const avgPayVariancePercent = scenario1.impact.averageCallPayPerProvider > 0
    ? (avgPayVariance / scenario1.impact.averageCallPayPerProvider) * 100
    : 0;

  variances.push({
    field: 'Average Call Pay per Provider',
    scenario1Value: scenario1.impact.averageCallPayPerProvider,
    scenario2Value: scenario2.impact.averageCallPayPerProvider,
    variance: avgPayVariance,
    variancePercent: avgPayVariancePercent,
  });

  // Compare call pay per 1.0 FTE
  const fteVariance = scenario2.impact.callPayPer1FTE - scenario1.impact.callPayPer1FTE;
  const fteVariancePercent = scenario1.impact.callPayPer1FTE > 0
    ? (fteVariance / scenario1.impact.callPayPer1FTE) * 100
    : 0;

  variances.push({
    field: 'Call Pay per 1.0 FTE',
    scenario1Value: scenario1.impact.callPayPer1FTE,
    scenario2Value: scenario2.impact.callPayPer1FTE,
    variance: fteVariance,
    variancePercent: fteVariancePercent,
  });

  // Compare tier-by-tier
  const allTierIds = new Set([
    ...scenario1.impact.tiers.map(t => t.tierId),
    ...scenario2.impact.tiers.map(t => t.tierId),
  ]);

  for (const tierId of allTierIds) {
    const tier1 = scenario1.impact.tiers.find(t => t.tierId === tierId);
    const tier2 = scenario2.impact.tiers.find(t => t.tierId === tierId);

    if (tier1 && tier2) {
      // Compare annual pay per provider for this tier
      const tierVariance = tier2.annualPayPerProvider - tier1.annualPayPerProvider;
      const tierVariancePercent = tier1.annualPayPerProvider > 0
        ? (tierVariance / tier1.annualPayPerProvider) * 100
        : 0;

      variances.push({
        field: `Tier ${tier1.tierName} - Annual Pay per Provider`,
        scenario1Value: tier1.annualPayPerProvider,
        scenario2Value: tier2.annualPayPerProvider,
        variance: tierVariance,
        variancePercent: tierVariancePercent,
      });
    } else if (tier1) {
      variances.push({
        field: `Tier ${tier1.tierName} - Annual Pay per Provider`,
        scenario1Value: tier1.annualPayPerProvider,
        scenario2Value: 0,
        variance: -tier1.annualPayPerProvider,
        variancePercent: -100,
      });
    } else if (tier2) {
      variances.push({
        field: `Tier ${tier2.tierName} - Annual Pay per Provider`,
        scenario1Value: 0,
        scenario2Value: tier2.annualPayPerProvider,
        variance: tier2.annualPayPerProvider,
        variancePercent: 100,
      });
    }
  }

  // Compare context differences
  if (scenario1.context.providersOnCall !== scenario2.context.providersOnCall) {
    variances.push({
      field: 'Providers on Call',
      scenario1Value: scenario1.context.providersOnCall,
      scenario2Value: scenario2.context.providersOnCall,
      variance: scenario2.context.providersOnCall - scenario1.context.providersOnCall,
      variancePercent: scenario1.context.providersOnCall > 0
        ? ((scenario2.context.providersOnCall - scenario1.context.providersOnCall) / scenario1.context.providersOnCall) * 100
        : 0,
    });
  }

  if (scenario1.context.rotationRatio !== scenario2.context.rotationRatio) {
    variances.push({
      field: 'Rotation Ratio',
      scenario1Value: `1-in-${scenario1.context.rotationRatio}`,
      scenario2Value: `1-in-${scenario2.context.rotationRatio}`,
      variance: scenario2.context.rotationRatio - scenario1.context.rotationRatio,
      variancePercent: scenario1.context.rotationRatio > 0
        ? ((scenario2.context.rotationRatio - scenario1.context.rotationRatio) / scenario1.context.rotationRatio) * 100
        : 0,
    });
  }

  return {
    scenarios: [scenario1, scenario2],
    variances,
    totalBudgetVariance: budgetVariance,
    totalBudgetVariancePercent: budgetVariancePercent,
    averagePayVariance: avgPayVariance,
    averagePayVariancePercent: avgPayVariancePercent,
  };
}

/**
 * Compare multiple scenarios (up to 4)
 */
export function compareMultipleScenarios(scenarios: ScenarioData[]): ScenarioComparison {
  if (scenarios.length < 2) {
    throw new Error('At least 2 scenarios required for comparison');
  }

  if (scenarios.length > 4) {
    throw new Error('Maximum 4 scenarios can be compared');
  }

  // For multiple scenarios, compare each to the first one
  const baseScenario = scenarios[0];
  const variances: ComparisonVariance[] = [];

  // Compare total budgets
  const budgets = scenarios.map(s => s.impact.totalAnnualCallSpend);
  const minBudget = Math.min(...budgets);
  const maxBudget = Math.max(...budgets);
  const budgetRange = maxBudget - minBudget;

  scenarios.forEach((scenario, index) => {
    if (index === 0) return;

    const budgetVariance = scenario.impact.totalAnnualCallSpend - baseScenario.impact.totalAnnualCallSpend;
    const budgetVariancePercent = baseScenario.impact.totalAnnualCallSpend > 0
      ? (budgetVariance / baseScenario.impact.totalAnnualCallSpend) * 100
      : 0;

    variances.push({
      field: `Total Annual Call Budget (vs ${baseScenario.name})`,
      scenario1Value: baseScenario.impact.totalAnnualCallSpend,
      scenario2Value: scenario.impact.totalAnnualCallSpend,
      variance: budgetVariance,
      variancePercent: budgetVariancePercent,
    });
  });

  return {
    scenarios,
    variances,
    totalBudgetVariance: budgetRange,
    totalBudgetVariancePercent: minBudget > 0 ? (budgetRange / minBudget) * 100 : 0,
    averagePayVariance: 0,
    averagePayVariancePercent: 0,
  };
}

/**
 * Format variance for display
 */
export function formatVariance(variance: number, isPercent: boolean = false): string {
  const sign = variance >= 0 ? '+' : '';
  if (isPercent) {
    return `${sign}${variance.toFixed(1)}%`;
  }
  return `${sign}$${Math.abs(variance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}





