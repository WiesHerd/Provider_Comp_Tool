/**
 * Call Schedule Types
 * 
 * Data structures for representing call schedule assignments
 * and calendar-based burden calculations.
 */

export type CallDayType = "weekday" | "weekend" | "holiday";

/**
 * Represents a provider assignment for a specific tier on a day
 * Each tier (C1, C2, C3, etc.) requires its own provider assignment
 */
export interface TierAssignment {
  tierId: string; // e.g., "C1", "C2", "C3"
  providerId: string | null; // null if unassigned for this tier
}

/**
 * Represents a single day's call assignments
 * Each day can have multiple tier assignments (C1, C2, C3, etc.)
 * Each tier requires its own provider assignment
 */
export interface CallDayAssignment {
  date: Date;
  type: CallDayType;
  tierAssignments: TierAssignment[]; // One assignment per tier (C1, C2, C3, etc.)
}

/**
 * Complete call schedule for a year
 */
export interface CallSchedule {
  year: number;
  assignments: CallDayAssignment[]; // length = number of days in year
}

/**
 * Options for generating a call schedule
 */
export interface GenerateScheduleOptions {
  year: number;
  providers: Array<{
    id: string;
    name?: string;
    fte: number;
    tierId: string;
    eligibleForCall: boolean;
  }>;
  assumptions: {
    weekdayCallsPerMonth: number;
    weekendCallsPerMonth: number;
    holidaysPerYear: number;
  };
  activeTierId: string | null;
  holidays?: Date[]; // Optional: specific holiday dates
}

/**
 * Burden results calculated from actual schedule
 */
export interface ScheduleBurdenResult {
  providerId: string;
  providerName?: string;
  fte: number;
  weekdayCalls: number;
  weekendCalls: number;
  holidayCalls: number;
  totalCalls: number;
  burdenIndex: number; // Percentage deviation from group average
}

/**
 * Group-level fairness metrics from schedule
 */
export interface ScheduleFairnessSummary {
  groupAverageCalls: number;
  minCalls: number;
  maxCalls: number;
  averageCalls: number;
  standardDeviation: number;
  fairnessScore: number; // 0-100
  eligibleProviderCount: number;
}

