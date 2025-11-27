/**
 * Provider-Level Call Pay Types
 */

import { CallPayContext } from '@/types/call-pay';

export interface ProviderCallPayData {
  providerId: string;
  providerName: string;
  specialty: string;
  fte: number;
  callPayContext: CallPayContext;
  assignedTiers: string[]; // Tier IDs assigned to this provider
  expectedAnnualCallPay: number;
  expectedMonthlyCallPay: number;
  callSchedule?: CallSchedule;
}

export interface CallSchedule {
  year: number;
  months: MonthSchedule[];
}

export interface MonthSchedule {
  month: number;
  monthName: string;
  weekdayCalls: number;
  weekendCalls: number;
  holidayCalls: number;
  totalCalls: number;
  expectedPay: number;
}

export interface PeerComparison {
  providerId: string;
  specialty: string;
  averageCallPay: number;
  percentile: number;
  isAnonymized: boolean;
}



