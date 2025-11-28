/**
 * Manual test script for Call Pay Engine
 * 
 * Run with: npx tsx scripts/test-call-pay-engine.ts
 * Or use Node.js with ts-node if available
 */

import { calculateCallBudget } from '../lib/utils/call-pay-engine';
import {
  CallProgram,
  CallProvider,
  CallTier,
  CallAssumptions,
} from '../types/call-pay-engine';

// Example scenario from requirements
const program: CallProgram = {
  modelYear: 2024,
  specialty: 'Cardiology',
  providersOnCall: 4,
  rotationRatio: '1-in-4',
};

const providers: CallProvider[] = [
  { id: 'p1', name: 'Provider 1', fte: 1.0, tierId: 'C1', eligibleForCall: true },
  { id: 'p2', name: 'Provider 2', fte: 1.0, tierId: 'C1', eligibleForCall: true },
  { id: 'p3', name: 'Provider 3', fte: 1.0, tierId: 'C1', eligibleForCall: true },
  { id: 'p4', name: 'Provider 4', fte: 1.0, tierId: 'C1', eligibleForCall: true },
];

const tiers: CallTier[] = [
  {
    id: 'C1',
    coverageType: 'In-house',
    paymentMethod: 'Daily',
    baseRate: 500,
    enabled: true,
  },
];

const assumptions: CallAssumptions = {
  weekdayCallsPerMonth: 5,
  weekendCallsPerMonth: 2,
  holidaysPerYear: 10,
};

// Run the calculation
console.log('=== Call Pay Engine Test ===\n');
console.log('Input:');
console.log('- Providers:', program.providersOnCall);
console.log('- Weekday calls/month:', assumptions.weekdayCallsPerMonth);
console.log('- Weekend calls/month:', assumptions.weekendCallsPerMonth);
console.log('- Holidays/year:', assumptions.holidaysPerYear);
console.log('- Base rate:', tiers[0].baseRate);
console.log('\n');

const result = calculateCallBudget(program, providers, tiers, assumptions);

console.log('Results:');
console.log('- Total Annual Call Budget: $', result.totalAnnualCallBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
console.log('- Avg Call Pay Per Provider: $', result.avgCallPayPerProvider.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
console.log('- Call Pay Per 1.0 FTE: $', result.callPayPerFTE.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
console.log('- Effective $ per 24h: $', result.effectivePer24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
console.log('- Effective $ per call: $', result.effectivePerCall.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
console.log('\n');

if (result.debug) {
  console.log('Debug Info:');
  console.log('- Active Tier:', result.debug.activeTierId);
  console.log('- Total Calls/Year:', result.debug.totalCalls);
  console.log('- Calls Per Provider:', result.debug.callsPerProvider?.toFixed(1));
  console.log('- Eligible Providers:', result.debug.eligibleProvidersCount);
  console.log('- Total FTE:', result.debug.totalFTE);
  console.log('- Weekday Calls/Year:', result.debug.weekdayCallsPerYear);
  console.log('- Weekend Calls/Year:', result.debug.weekendCallsPerYear);
  console.log('- Holiday Calls/Year:', result.debug.holidayCallsPerYear);
  console.log('- Rates:', result.debug.rates);
}




