/**
 * Test Schedule Data Generator
 * 
 * Generates sample schedule data for testing and demonstration purposes.
 */

import { generateCallSchedule } from './call-schedule-generator';
import { CallProvider } from '@/types/call-pay-engine';
import { CallSchedule } from '@/types/call-schedule';

/**
 * Generate test providers for demonstration
 */
export function generateTestProviders(): CallProvider[] {
  return [
    {
      id: 'p1',
      name: 'Dr. Sarah Johnson',
      fte: 1.0,
      tierId: 'C1',
      eligibleForCall: true,
    },
    {
      id: 'p2',
      name: 'Dr. Michael Chen',
      fte: 1.0,
      tierId: 'C1',
      eligibleForCall: true,
    },
    {
      id: 'p3',
      name: 'Dr. Emily Rodriguez',
      fte: 0.75,
      tierId: 'C1',
      eligibleForCall: true,
    },
    {
      id: 'p4',
      name: 'Dr. James Wilson',
      fte: 0.5,
      tierId: 'C1',
      eligibleForCall: true,
    },
    {
      id: 'p5',
      name: 'Dr. Lisa Anderson',
      fte: 1.0,
      tierId: 'C1',
      eligibleForCall: false, // Not eligible
    },
  ];
}

/**
 * Generate test assumptions
 */
export function generateTestAssumptions() {
  return {
    weekdayCallsPerMonth: 8,
    weekendCallsPerMonth: 4,
    holidaysPerYear: 12,
  };
}

/**
 * Generate a complete test schedule
 */
export function generateTestSchedule(year: number = new Date().getFullYear()): CallSchedule {
  const providers = generateTestProviders();
  const assumptions = generateTestAssumptions();

  return generateCallSchedule({
    year,
    providers,
    assumptions,
    activeTierId: 'C1',
  });
}

/**
 * Generate test schedule with custom parameters
 */
export function generateCustomTestSchedule(options: {
  year?: number;
  providerCount?: number;
  weekdayCallsPerMonth?: number;
  weekendCallsPerMonth?: number;
  holidaysPerYear?: number;
}): CallSchedule {
  const {
    year = new Date().getFullYear(),
    providerCount = 4,
    weekdayCallsPerMonth = 8,
    weekendCallsPerMonth = 4,
    holidaysPerYear = 12,
  } = options;

  // Generate providers
  const providers: CallProvider[] = [];
  const names = [
    'Dr. Sarah Johnson',
    'Dr. Michael Chen',
    'Dr. Emily Rodriguez',
    'Dr. James Wilson',
    'Dr. Lisa Anderson',
    'Dr. Robert Martinez',
    'Dr. Jennifer Lee',
    'Dr. David Thompson',
  ];

  for (let i = 0; i < providerCount; i++) {
    providers.push({
      id: `p${i + 1}`,
      name: names[i] || `Provider ${i + 1}`,
      fte: i < 2 ? 1.0 : i === 2 ? 0.75 : 0.5, // Mix of FTE values
      tierId: 'C1',
      eligibleForCall: true,
    });
  }

  return generateCallSchedule({
    year,
    providers,
    assumptions: {
      weekdayCallsPerMonth,
      weekendCallsPerMonth,
      holidaysPerYear,
    },
    activeTierId: 'C1',
  });
}























