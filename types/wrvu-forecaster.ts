export interface ShiftType {
  id: string;
  name: string;
  hours: number;
  perWeek: number;
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

// Helper function to convert daysOfWeek to perWeek
export function daysOfWeekToPerWeek(daysOfWeek?: number[]): number {
  if (!daysOfWeek || daysOfWeek.length === 0) return 0;
  return daysOfWeek.length;
}

// Helper function to convert perWeek to daysOfWeek (for migration)
export function perWeekToDaysOfWeek(perWeek: number): number[] {
  if (perWeek === 0) return [];
  if (perWeek === 5) return [1, 2, 3, 4, 5]; // Mon-Fri
  if (perWeek === 1) return [1]; // Monday
  if (perWeek === 7) return [0, 1, 2, 3, 4, 5, 6]; // All days
  // For other values, distribute evenly across weekdays (Mon-Fri)
  const weekdays = [1, 2, 3, 4, 5];
  const result: number[] = [];
  for (let i = 0; i < perWeek && i < weekdays.length; i++) {
    result.push(weekdays[i]);
  }
  return result;
}

export interface WRVUForecasterInputs {
  providerName?: string;
  specialty?: string;
  customSpecialty?: string;
  vacationWeeks: number;
  statutoryHolidays: number;
  cmeDays: number;
  shifts: ShiftType[];
  patientsPerHour: number;
  patientsPerDay: number;
  avgWRVUPerEncounter: number;
  adjustedWRVUPerEncounter: number;
  baseSalary: number;
  wrvuConversionFactor: number;
  isPerHour: boolean;
  // Calendar-based fields
  dailyPatientCounts?: Record<string, number>; // Map of date strings (YYYY-MM-DD) to patient counts
  dailyHours?: Record<string, number>; // Map of date strings (YYYY-MM-DD) to hours per day
  vacationDates?: string[]; // Array of date strings for vacation days
  cmeDates?: string[]; // Array of date strings for CME days
  statutoryHolidayDates?: string[]; // Array of date strings for statutory holidays
  isFromTemplate?: boolean; // Flag to indicate data was generated from template
}

export interface ProductivityMetrics {
  weeksWorkedPerYear: number;
  annualClinicDays: number;
  annualClinicalHours: number;
  encountersPerWeek: number;
  annualPatientEncounters: number;
  estimatedAnnualWRVUs: number;
  estimatedTotalCompensation: number;
  wrvuCompensation: number;
}

export interface WRVUForecasterScenario {
  id: string;
  name: string;
  providerName?: string;
  specialty?: string;
  inputs: WRVUForecasterInputs;
  metrics: ProductivityMetrics;
  date: string;
}



