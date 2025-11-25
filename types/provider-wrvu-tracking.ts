import { type DateString } from '@/lib/utils/calendar-helpers';

export interface DailyTrackingData {
  patients: number;
  workRVUs: number;
}

export interface ProviderWRVUTrackingState {
  dailyData: Record<DateString, DailyTrackingData>;
  currentMonth: string; // ISO date string (YYYY-MM-DD format for first day of month)
  providerName?: string;
}

