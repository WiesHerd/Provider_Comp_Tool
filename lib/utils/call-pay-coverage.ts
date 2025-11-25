/**
 * Call Pay & Coverage Modeler Calculation Utilities
 */

import {
  CallTier,
  CallPayContext,
  CallPayImpact,
  TierImpact,
  CallPayBenchmarks,
} from '@/types/call-pay';
import { calculatePercentile } from './percentile';

/**
 * Calculate annual call pay for a single tier
 */
export function calculateTierAnnualPay(
  tier: CallTier,
  context: CallPayContext
): number {
  if (!tier.enabled) return 0;

  const { paymentMethod, rates, burden } = tier;
  const { rotationRatio } = context;

  // Calculate monthly pay based on payment method
  let monthlyPay = 0;

  switch (paymentMethod) {
    case 'Annual stipend':
      // Annual stipend is already annual, divide by 12 for monthly
      monthlyPay = rates.weekday / 12;
      break;

    case 'Daily / shift rate':
      // Calculate based on weekday/weekend/holiday shifts
      // Burden represents total calls needed per month for the service
      const weekdayMonthly = burden.weekdayCallsPerMonth * rates.weekday;
      const weekendMonthly = burden.weekendCallsPerMonth * rates.weekend;
      // Holidays are annual, so average monthly: holidaysPerYear / 12
      const holidayMonthly = (burden.holidaysPerYear / 12) * rates.holiday;
      monthlyPay = weekdayMonthly + weekendMonthly + holidayMonthly;
      break;

    case 'Hourly rate':
      // Assume 24-hour shifts
      const weekdayHours = burden.weekdayCallsPerMonth * 24 * rates.weekday;
      const weekendHours = burden.weekendCallsPerMonth * 24 * rates.weekend;
      const holidayHours = (burden.holidaysPerYear / 12) * 24 * rates.holiday;
      monthlyPay = weekdayHours + weekendHours + holidayHours;
      break;

    case 'Monthly retainer':
      monthlyPay = rates.weekday; // Base monthly retainer
      break;

    case 'Per procedure':
      // Use avgCasesPer24h if available, otherwise use callbacks
      const avgCasesPerCall = burden.avgCasesPer24h || burden.avgCallbacksPer24h;
      
      // Calculate weekday procedures
      const weekdayCasesPerMonth = avgCasesPerCall * burden.weekdayCallsPerMonth;
      const weekdayProcedurePay = weekdayCasesPerMonth * rates.weekday;
      
      // Calculate weekend procedures (use weekend rate if provided, otherwise weekday rate)
      const weekendRate = rates.weekend > 0 ? rates.weekend : rates.weekday;
      const weekendCasesPerMonth = avgCasesPerCall * burden.weekendCallsPerMonth;
      const weekendProcedurePay = weekendCasesPerMonth * weekendRate;
      
      // Calculate holiday procedures (use holiday rate if provided, otherwise weekday rate)
      // Holidays are annual, so average monthly: holidaysPerYear / 12
      const holidayRate = rates.holiday > 0 ? rates.holiday : rates.weekday;
      const holidayCasesPerMonth = avgCasesPerCall * (burden.holidaysPerYear / 12);
      const holidayProcedurePay = holidayCasesPerMonth * holidayRate;
      
      monthlyPay = weekdayProcedurePay + weekendProcedurePay + holidayProcedurePay;
      break;

    case 'Per wRVU':
      // Use avgCasesPer24h if available, otherwise use callbacks
      const avgWrvusPerCall = burden.avgCasesPer24h || burden.avgCallbacksPer24h;
      
      // Calculate weekday wRVUs
      const weekdayWrvusPerMonth = avgWrvusPerCall * burden.weekdayCallsPerMonth;
      const weekdayWrvuPay = weekdayWrvusPerMonth * rates.weekday;
      
      // Calculate weekend wRVUs (use weekend rate if provided, otherwise weekday rate)
      const weekendWrvuRate = rates.weekend > 0 ? rates.weekend : rates.weekday;
      const weekendWrvusPerMonth = avgWrvusPerCall * burden.weekendCallsPerMonth;
      const weekendWrvuPay = weekendWrvusPerMonth * weekendWrvuRate;
      
      // Calculate holiday wRVUs (use holiday rate if provided, otherwise weekday rate)
      // Holidays are annual, so average monthly: holidaysPerYear / 12
      const holidayWrvuRate = rates.holiday > 0 ? rates.holiday : rates.weekday;
      const holidayWrvusPerMonth = avgWrvusPerCall * (burden.holidaysPerYear / 12);
      const holidayWrvuPay = holidayWrvusPerMonth * holidayWrvuRate;
      
      monthlyPay = weekdayWrvuPay + weekendWrvuPay + holidayWrvuPay;
      break;
  }

  // Apply trauma uplift if applicable
  if (rates.traumaUpliftPercent && rates.traumaUpliftPercent > 0) {
    monthlyPay *= 1 + rates.traumaUpliftPercent / 100;
  }

  // Annual pay per provider
  // Note: monthlyPay represents TOTAL monthly pay needed for all calls (burden × rates)
  const annualPayPerProvider = monthlyPay * 12;

  // Adjust for rotation ratio (1-in-N means each provider covers 1/N of the calls)
  // Industry Standard (per SullivanCotter/Gallagher): Rotation ratio distributes total burden
  // Example: 1-in-4 rotation means each provider covers 1/4 of total calls
  // If rotation is 1-in-4, each provider gets 1/4 of the annual pay
  // This is mathematically correct: if 4 providers rotate, each takes 1/4 of the burden
  const adjustedAnnualPay = annualPayPerProvider / rotationRatio;

  return adjustedAnnualPay;
}

/**
 * Calculate effective $/24h for a tier
 */
export function calculateEffectiveDollarsPer24h(
  tier: CallTier,
  context: CallPayContext
): number {
  if (!tier.enabled) return 0;

  const annualPay = calculateTierAnnualPay(tier, context);
  const totalCallsPerYear =
    (tier.burden.weekdayCallsPerMonth +
      tier.burden.weekendCallsPerMonth) *
    12 +
    tier.burden.holidaysPerYear;

  if (totalCallsPerYear === 0) return 0;

  return annualPay / totalCallsPerYear;
}

/**
 * Calculate effective $/call for a tier
 */
export function calculateEffectiveDollarsPerCall(
  tier: CallTier,
  context: CallPayContext
): number {
  if (!tier.enabled) return 0;

  const annualPay = calculateTierAnnualPay(tier, context);
  
  // For Daily/Shift Rate and Hourly Rate: use total calls/shifts per year
  // For Per Procedure and Per wRVU: use total callbacks/cases per year
  // For Annual Stipend and Monthly Retainer: not applicable (return 0 or use calls if available)
  
  if (tier.paymentMethod === 'Daily / shift rate' || tier.paymentMethod === 'Hourly rate') {
    // Calculate total calls/shifts per year
    const totalCallsPerYear =
      (tier.burden.weekdayCallsPerMonth + tier.burden.weekendCallsPerMonth) *
      12 +
      tier.burden.holidaysPerYear;
    
    if (totalCallsPerYear === 0) return 0;
    
    return annualPay / totalCallsPerYear;
  } else if (tier.paymentMethod === 'Per procedure' || tier.paymentMethod === 'Per wRVU') {
    // Use avgCasesPer24h if available, otherwise use callbacks
    const avgCasesPerCall = tier.burden.avgCasesPer24h || tier.burden.avgCallbacksPer24h;
    
    if (!avgCasesPerCall || avgCasesPerCall === 0) return 0;
    
    // Calculate total cases/callbacks per year including holidays
    const totalCallbacksPerYear =
      avgCasesPerCall *
      ((tier.burden.weekdayCallsPerMonth + tier.burden.weekendCallsPerMonth) *
        12 +
        tier.burden.holidaysPerYear);

    if (totalCallbacksPerYear === 0) return 0;

    return annualPay / totalCallbacksPerYear;
  } else {
    // For Annual Stipend and Monthly Retainer, $/call doesn't apply
    // But we can calculate based on total calls if available
    const totalCallsPerYear =
      (tier.burden.weekdayCallsPerMonth + tier.burden.weekendCallsPerMonth) *
      12 +
      tier.burden.holidaysPerYear;
    
    if (totalCallsPerYear === 0) return 0;
    
    return annualPay / totalCallsPerYear;
  }
}

/**
 * Calculate impact for all tiers
 */
export function calculateCallPayImpact(
  tiers: CallTier[],
  context: CallPayContext,
  tccReference?: number
): CallPayImpact {
  const tierImpacts: TierImpact[] = tiers
    .filter((tier) => tier.enabled)
    .map((tier) => {
      const annualPayPerProvider = calculateTierAnnualPay(tier, context);
      const annualPayForGroup =
        annualPayPerProvider * context.providersOnCall;
      const effectiveDollarsPer24h = calculateEffectiveDollarsPer24h(
        tier,
        context
      );
      const effectiveDollarsPerCall = calculateEffectiveDollarsPerCall(
        tier,
        context
      );

      return {
        tierId: tier.id,
        tierName: tier.name,
        annualPayPerProvider,
        annualPayForGroup,
        effectiveDollarsPer24h,
        effectiveDollarsPerCall,
      };
    });

  const totalAnnualCallSpend = tierImpacts.reduce(
    (sum, impact) => sum + impact.annualPayForGroup,
    0
  );

  const averageCallPayPerProvider =
    tierImpacts.length > 0
      ? tierImpacts.reduce(
          (sum, impact) => sum + impact.annualPayPerProvider,
          0
        ) / tierImpacts.length
      : 0;

  // Call pay per 1.0 FTE (assuming rotation ratio represents FTE distribution)
  // Industry Standard: This represents what call pay would be if provider was taking call
  // at the full rotation frequency (e.g., if 1-in-4, this shows pay for 1-in-1 equivalent)
  const callPayPer1FTE = averageCallPayPerProvider * context.rotationRatio;

  // Calculate as % of TCC if reference provided
  const callPayAsPercentOfTCC =
    tccReference && tccReference > 0
      ? (averageCallPayPerProvider / tccReference) * 100
      : undefined;

  return {
    tiers: tierImpacts,
    totalAnnualCallSpend,
    averageCallPayPerProvider,
    callPayPer1FTE,
    callPayAsPercentOfTCC,
  };
}

/**
 * Calculate percentile for a rate using benchmarks
 */
export function calculateRatePercentile(
  rate: number,
  benchmarks?: { p25?: number; p50?: number; p75?: number; p90?: number }
): number {
  if (!benchmarks) return 50; // Default if no benchmarks

  return calculatePercentile(rate, benchmarks);
}

/**
 * Calculate percentiles for weekday, weekend, and holiday rates
 */
export function calculateRatePercentiles(
  weekdayRate: number,
  weekendRate: number,
  holidayRate: number,
  benchmarks: CallPayBenchmarks
): {
  weekdayPercentile: number;
  weekendPercentile: number;
  holidayPercentile: number;
} {
  return {
    weekdayPercentile: calculateRatePercentile(weekdayRate, benchmarks.weekday),
    weekendPercentile: calculateRatePercentile(
      weekendRate,
      benchmarks.weekend
    ),
    holidayPercentile: calculateRatePercentile(
      holidayRate,
      benchmarks.holiday
    ),
  };
}

