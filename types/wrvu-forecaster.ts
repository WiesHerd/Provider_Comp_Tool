export interface ShiftType {
  id: string;
  name: string;
  hours: number;
  perWeek: number;
}

export interface WRVUForecasterInputs {
  providerName?: string;
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
  inputs: WRVUForecasterInputs;
  metrics: ProductivityMetrics;
  date: string;
}



