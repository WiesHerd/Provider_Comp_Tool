/**
 * Validation utilities for Call Pay Modeler
 */

import { CallTier, CallPayContext } from '@/types/call-pay';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate tier configuration
 */
export function validateTier(tier: CallTier, context: CallPayContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!tier.enabled) {
    return { isValid: true, errors: [], warnings: [] };
  }

  // Validate burden assumptions
  if (tier.burden.weekdayCallsPerMonth > 22) {
    warnings.push(
      `Weekday calls (${tier.burden.weekdayCallsPerMonth}) exceeds typical business days per month (22). Verify this is correct.`
    );
  }

  if (tier.burden.weekendCallsPerMonth > 9) {
    warnings.push(
      `Weekend calls (${tier.burden.weekendCallsPerMonth}) exceeds typical weekends per month (8-9). Verify this is correct.`
    );
  }

  if (tier.burden.holidaysPerYear > 15) {
    warnings.push(
      `Holidays per year (${tier.burden.holidaysPerYear}) seems high. Typical range is 8-12.`
    );
  }

  // Validate rates
  if (tier.paymentMethod === 'Daily / shift rate' || tier.paymentMethod === 'Hourly rate') {
    if (tier.rates.weekday === 0 && tier.rates.weekend === 0 && tier.rates.holiday === 0) {
      warnings.push('All rates are $0. Verify this is intentional.');
    }
  }

  // Validate rotation ratio makes sense
  if (context.rotationRatio > context.providersOnCall) {
    errors.push(
      `Rotation ratio (1-in-${context.rotationRatio}) exceeds providers on call (${context.providersOnCall}). This is mathematically impossible.`
    );
  }

  if (context.rotationRatio < 1) {
    errors.push('Rotation ratio must be at least 1.');
  }

  // Validate procedural fields
  if (
    (tier.paymentMethod === 'Per procedure' || tier.paymentMethod === 'Per wRVU') &&
    !tier.burden.avgCasesPer24h &&
    !tier.burden.avgCallbacksPer24h
  ) {
    warnings.push(
      `${tier.paymentMethod} requires "Avg Cases per 24h" or "Avg Callbacks per 24h" to calculate pay.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate context configuration
 */
export function validateContext(context: CallPayContext): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (context.providersOnCall < 1) {
    errors.push('Must have at least 1 provider on call.');
  }

  if (context.rotationRatio < 1) {
    errors.push('Rotation ratio must be at least 1.');
  }

  if (context.modelYear < 2020 || context.modelYear > 2100) {
    warnings.push('Model year seems unusual. Verify this is correct.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}








