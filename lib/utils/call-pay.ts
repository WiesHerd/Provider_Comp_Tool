/**
 * Calculate per-call stipend compensation
 */
export interface PerCallInputs {
  weekdayCallsPerMonth: number;
  weekendCallsPerMonth: number;
  weekdayStipend: number;
  weekendStipend: number;
}

export interface CallPayResults {
  monthlyPay: number;
  annualPay: number;
  effectiveRate: number;
}

export function calculatePerCallStipend(inputs: PerCallInputs): CallPayResults {
  const monthlyPay =
    inputs.weekdayCallsPerMonth * inputs.weekdayStipend +
    inputs.weekendCallsPerMonth * inputs.weekendStipend;
  
  const annualPay = monthlyPay * 12;
  
  const totalCalls = inputs.weekdayCallsPerMonth + inputs.weekendCallsPerMonth;
  const effectiveRate = totalCalls > 0 ? monthlyPay / totalCalls : 0;

  return {
    monthlyPay,
    annualPay,
    effectiveRate,
  };
}

/**
 * Calculate per-shift compensation
 */
export interface PerShiftInputs {
  weekdayShiftsPerMonth: number;
  weekendShiftsPerMonth: number;
  weekdayRate: number;
  weekendRate: number;
}

export function calculatePerShiftPay(inputs: PerShiftInputs): CallPayResults {
  const monthlyPay =
    inputs.weekdayShiftsPerMonth * inputs.weekdayRate +
    inputs.weekendShiftsPerMonth * inputs.weekendRate;
  
  const annualPay = monthlyPay * 12;
  
  const totalShifts = inputs.weekdayShiftsPerMonth + inputs.weekendShiftsPerMonth;
  const effectiveRate = totalShifts > 0 ? monthlyPay / totalShifts : 0;

  return {
    monthlyPay,
    annualPay,
    effectiveRate,
  };
}

/**
 * Calculate tiered call pay compensation
 */
export interface TieredCallPayInputs {
  threshold: number; // calls/shifts per month threshold
  rateBelowThreshold: number;
  rateAboveThreshold: number;
  actualCallsOrShifts: number; // actual monthly calls/shifts
}

export function calculateTieredCallPay(inputs: TieredCallPayInputs): CallPayResults {
  const { threshold, rateBelowThreshold, rateAboveThreshold, actualCallsOrShifts } = inputs;

  let monthlyPay = 0;
  
  if (actualCallsOrShifts <= threshold) {
    monthlyPay = actualCallsOrShifts * rateBelowThreshold;
  } else {
    monthlyPay = threshold * rateBelowThreshold + (actualCallsOrShifts - threshold) * rateAboveThreshold;
  }

  const annualPay = monthlyPay * 12;
  const blendedAverageRate = actualCallsOrShifts > 0 ? monthlyPay / actualCallsOrShifts : 0;

  return {
    monthlyPay,
    annualPay,
    effectiveRate: blendedAverageRate,
  };
}




