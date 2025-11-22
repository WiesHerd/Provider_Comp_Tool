import { FTE } from '@/types';

/**
 * Normalize a value to 1.0 FTE
 */
export function normalizeToFTE(value: number, fte: FTE): number {
  if (fte === 0) return 0;
  return value / fte;
}

/**
 * Calculate normalized wRVUs
 */
export function normalizeWrvus(wrvus: number, fte: FTE): number {
  return normalizeToFTE(wrvus, fte);
}

/**
 * Calculate normalized TCC
 */
export function normalizeTcc(totalTcc: number, fte: FTE): number {
  return normalizeToFTE(totalTcc, fte);
}

/**
 * Calculate effective conversion factor (TCC / wRVUs)
 */
export function calculateEffectiveCF(normalizedTcc: number, normalizedWrvus: number): number {
  if (normalizedWrvus === 0) return 0;
  return normalizedTcc / normalizedWrvus;
}

