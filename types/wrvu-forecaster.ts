export interface ShiftType {
  id: string;
  name: string;
  hours: number;
  perWeek: number;
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
  vacationDates?: string[]; // Array of date strings for vacation days
  cmeDates?: string[]; // Array of date strings for CME days
  statutoryHolidayDates?: string[]; // Array of date strings for statutory holidays
  useCalendarMode?: boolean; // Flag to use calendar data vs. number inputs
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



