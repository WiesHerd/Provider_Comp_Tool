/**
 * Budget Forecasting Utilities
 * Multi-year budget planning with rate increases and provider growth
 */

import {
  CallPayContext,
  CallTier,
  CallPayImpact,
} from '@/types/call-pay';
import { calculateCallPayImpact } from './call-pay-coverage';

export interface ForecastAssumptions {
  rateIncreasePercent: number; // Annual rate increase (e.g., 2.5 for 2.5%)
  providerGrowthPercent: number; // Annual provider growth (e.g., 5 for 5%)
  yearsToForecast: number; // Number of years to project (typically 3-5)
}

export interface YearlyForecast {
  year: number;
  baseBudget: number;
  adjustedBudget: number;
  rateIncrease: number;
  providerGrowth: number;
  totalProviders: number;
  averagePayPerProvider: number;
  assumptions: ForecastAssumptions;
}

export interface MultiYearForecast {
  baseYear: number;
  baseBudget: number;
  forecasts: YearlyForecast[];
  totalProjectedSpend: number;
}

/**
 * Generate multi-year budget forecast
 */
export function generateBudgetForecast(
  context: CallPayContext,
  tiers: CallTier[],
  impact: CallPayImpact,
  assumptions: ForecastAssumptions
): MultiYearForecast {
  const baseYear = context.modelYear;
  const baseBudget = impact.totalAnnualCallSpend;
  const baseProviders = context.providersOnCall;
  const baseAveragePay = impact.averageCallPayPerProvider;

  const forecasts: YearlyForecast[] = [];
  let currentProviders = baseProviders;
  let currentAveragePay = baseAveragePay;
  let cumulativeRateIncrease = 1;

  for (let yearOffset = 1; yearOffset <= assumptions.yearsToForecast; yearOffset++) {
    const year = baseYear + yearOffset;
    
    // Apply rate increase
    cumulativeRateIncrease *= (1 + assumptions.rateIncreasePercent / 100);
    const rateIncrease = (cumulativeRateIncrease - 1) * 100;
    
    // Apply provider growth
    currentProviders = Math.round(baseProviders * Math.pow(1 + assumptions.providerGrowthPercent / 100, yearOffset));
    const providerGrowth = ((currentProviders - baseProviders) / baseProviders) * 100;
    
    // Calculate adjusted pay per provider (with rate increases)
    currentAveragePay = baseAveragePay * cumulativeRateIncrease;
    
    // Calculate adjusted budget
    const adjustedBudget = currentAveragePay * currentProviders;

    forecasts.push({
      year,
      baseBudget,
      adjustedBudget,
      rateIncrease,
      providerGrowth,
      totalProviders: currentProviders,
      averagePayPerProvider: currentAveragePay,
      assumptions,
    });
  }

  const totalProjectedSpend = forecasts.reduce((sum, f) => sum + f.adjustedBudget, baseBudget);

  return {
    baseYear,
    baseBudget,
    forecasts,
    totalProjectedSpend,
  };
}

/**
 * Calculate budget variance
 */
export function calculateBudgetVariance(
  actual: number,
  budgeted: number
): {
  variance: number;
  variancePercent: number;
  isOverBudget: boolean;
} {
  const variance = actual - budgeted;
  const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;
  const isOverBudget = variance > 0;

  return {
    variance,
    variancePercent,
    isOverBudget,
  };
}



