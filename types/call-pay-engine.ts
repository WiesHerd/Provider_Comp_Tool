/**
 * Call Pay Engine - Phase 1 Data Model
 * 
 * This module defines the core data structures for the call pay calculation engine.
 * These types are separate from the existing call-pay types to allow parallel development.
 */

/**
 * Call Program represents the overall call coverage program
 */
export interface CallProgram {
  modelYear: number;
  specialty: string;
  serviceLine?: string;
  providersOnCall: number; // e.g. 4
  rotationRatio?: string; // e.g. "1-in-4"
}

/**
 * Individual provider participating in the call program
 */
export interface CallProvider {
  id: string;
  name?: string;
  fte: number; // e.g. 1.0 or 0.7
  tierId: string; // links to CallTier.id
  eligibleForCall: boolean;
  startMonth?: number; // optional (for future use)
  endMonth?: number; // optional
}

/**
 * Call Tier defines payment structure for a coverage level
 */
export interface CallTier {
  id: string; // e.g. "C1"
  coverageType: "In-house" | "Home-call" | string;
  paymentMethod: "Daily" | "Shift" | "Per call" | string;
  baseRate: number; // weekday
  weekendUpliftPct?: number;
  holidayUpliftPct?: number;
  traumaUpliftPct?: number;
  enabled?: boolean; // whether this tier is active
}

/**
 * Group-level assumptions for call volume and distribution
 */
export interface CallAssumptions {
  weekdayCallsPerMonth: number; // group-level, not per provider
  weekendCallsPerMonth: number;
  holidaysPerYear: number;
  benefitLoadPct?: number; // e.g. 30% (optional, future)
}

/**
 * Result of call budget calculation
 */
export interface BudgetResult {
  totalAnnualCallBudget: number;
  avgCallPayPerProvider: number;
  callPayPerFTE: number;
  effectivePer24h: number;
  effectivePerCall: number;
  debug?: any; // for future transparency
}


