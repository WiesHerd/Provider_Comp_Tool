/**
 * Call Pay Engine - Phase 1
 * 
 * Pure calculation function for call pay budgeting.
 * This is the core logic layer that defines the truth for call pay calculations.
 */

import {
  CallProgram,
  CallProvider,
  CallTier,
  CallAssumptions,
  BudgetResult,
} from '@/types/call-pay-engine';

/**
 * Calculate call budget based on program, providers, tiers, and assumptions.
 * 
 * This is a pure function that takes plain inputs and returns calculated outputs.
 * It does not depend on UI state or hooks.
 * 
 * @param program - Call program configuration
 * @param providers - Array of providers participating in the call program
 * @param tiers - Array of call tiers (payment structures)
 * @param assumptions - Group-level assumptions about call volume
 * @returns BudgetResult with all calculated metrics
 */
export function calculateCallBudget(
  program: CallProgram,
  providers: CallProvider[],
  tiers: CallTier[],
  assumptions: CallAssumptions
): BudgetResult {
  // Phase 1: Assume only 1 active tier (use first enabled tier, or first tier if none enabled)
  const activeTier = tiers.find(tier => tier.enabled !== false) || tiers[0];
  
  if (!activeTier) {
    // No tier available, return zero budget
    return {
      totalAnnualCallBudget: 0,
      avgCallPayPerProvider: 0,
      callPayPerFTE: 0,
      effectivePer24h: 0,
      effectivePerCall: 0,
      debug: { error: 'No tier available' },
    };
  }

  // Filter to eligible providers only
  const eligibleProviders = providers.filter(p => p.eligibleForCall);
  
  if (eligibleProviders.length === 0) {
    return {
      totalAnnualCallBudget: 0,
      avgCallPayPerProvider: 0,
      callPayPerFTE: 0,
      effectivePer24h: 0,
      effectivePerCall: 0,
      debug: { error: 'No eligible providers' },
    };
  }

  // Calculate total annual calls
  // TODO Phase 2: More sophisticated distribution (weekday vs weekend weighting)
  const totalCalls = (assumptions.weekdayCallsPerMonth + assumptions.weekendCallsPerMonth) * 12 
                     + assumptions.holidaysPerYear;

  // Calculate average calls per provider
  // TODO Phase 2: Account for FTE differences in call distribution
  const callsPerProvider = totalCalls / program.providersOnCall;

  // Calculate rates with uplifts
  // Phase 1: Simple approach - use base rate for weekday, apply uplifts for weekend/holiday
  // TODO Phase 2: More sophisticated rate calculation based on actual call distribution
  const weekendRate = activeTier.baseRate * (1 + (activeTier.weekendUpliftPct || 0) / 100);
  const holidayRate = activeTier.baseRate * (1 + (activeTier.holidayUpliftPct || 0) / 100);
  
  // Apply trauma uplift if applicable
  const traumaMultiplier = 1 + (activeTier.traumaUpliftPct || 0) / 100;
  const adjustedWeekdayRate = activeTier.baseRate * traumaMultiplier;
  const adjustedWeekendRate = weekendRate * traumaMultiplier;
  const adjustedHolidayRate = holidayRate * traumaMultiplier;

  // Phase 1: Simple distribution - assume calls are evenly split between weekday/weekend/holiday
  // TODO Phase 2: Use actual distribution from assumptions
  const weekdayCallsPerYear = assumptions.weekdayCallsPerMonth * 12;
  const weekendCallsPerYear = assumptions.weekendCallsPerMonth * 12;
  const holidayCallsPerYear = assumptions.holidaysPerYear;

  // Calculate annual pay per provider
  // TODO Phase 3: Account for provider-specific FTE and tier assignments
  const weekdayPayPerProvider = (weekdayCallsPerYear / program.providersOnCall) * adjustedWeekdayRate;
  const weekendPayPerProvider = (weekendCallsPerYear / program.providersOnCall) * adjustedWeekendRate;
  const holidayPayPerProvider = (holidayCallsPerYear / program.providersOnCall) * adjustedHolidayRate;
  
  const avgCallPayPerProvider = weekdayPayPerProvider + weekendPayPerProvider + holidayPayPerProvider;

  // Calculate total annual call budget
  const totalAnnualCallBudget = avgCallPayPerProvider * program.providersOnCall;

  // Calculate call pay per 1.0 FTE
  // TODO Phase 2: Account for actual FTE distribution across providers
  const totalFTE = eligibleProviders.reduce((sum, p) => sum + p.fte, 0);
  const callPayPerFTE = totalFTE > 0 ? totalAnnualCallBudget / totalFTE : 0;

  // Calculate effective $ per 24h
  // This represents the average cost per 24-hour call period
  const effectivePer24h = totalCalls > 0 ? totalAnnualCallBudget / totalCalls : 0;

  // Calculate effective $ per call
  // This is the same as per 24h in Phase 1 (assuming one call per 24h period)
  // TODO Phase 2: Distinguish between call periods and actual call events
  const effectivePerCall = effectivePer24h;

  return {
    totalAnnualCallBudget,
    avgCallPayPerProvider,
    callPayPerFTE,
    effectivePer24h,
    effectivePerCall,
    debug: {
      activeTierId: activeTier.id,
      totalCalls,
      callsPerProvider,
      eligibleProvidersCount: eligibleProviders.length,
      totalFTE,
      weekdayCallsPerYear,
      weekendCallsPerYear,
      holidayCallsPerYear,
      rates: {
        weekday: adjustedWeekdayRate,
        weekend: adjustedWeekendRate,
        holiday: adjustedHolidayRate,
      },
    },
  };
}





