/**
 * Call Pay Engine - Phase 1 Test Suite
 */

import { calculateCallBudget } from '../call-pay-engine';
import {
  CallProgram,
  CallProvider,
  CallTier,
  CallAssumptions,
} from '@/types/call-pay-engine';

describe('Call Pay Engine - calculateCallBudget', () => {
  describe('Example Scenario from Requirements', () => {
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

    test('calculates non-zero total annual call budget', () => {
      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      expect(result.totalAnnualCallBudget).toBeGreaterThan(0);
    });

    test('calculates positive average call pay per provider', () => {
      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      expect(result.avgCallPayPerProvider).toBeGreaterThan(0);
    });

    test('calculates all required metrics correctly', () => {
      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      // Verify all metrics are present and calculated
      expect(result).toHaveProperty('totalAnnualCallBudget');
      expect(result).toHaveProperty('avgCallPayPerProvider');
      expect(result).toHaveProperty('callPayPerFTE');
      expect(result).toHaveProperty('effectivePer24h');
      expect(result).toHaveProperty('effectivePerCall');
      
      // Verify metrics are numbers
      expect(typeof result.totalAnnualCallBudget).toBe('number');
      expect(typeof result.avgCallPayPerProvider).toBe('number');
      expect(typeof result.callPayPerFTE).toBe('number');
      expect(typeof result.effectivePer24h).toBe('number');
      expect(typeof result.effectivePerCall).toBe('number');
    });

    test('calculates correct total annual calls', () => {
      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      // Expected: (5 + 2) * 12 + 10 = 84 + 10 = 94 calls per year
      const expectedTotalCalls = (5 + 2) * 12 + 10;
      expect(result.debug?.totalCalls).toBe(expectedTotalCalls);
    });

    test('calculates calls per provider correctly', () => {
      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      // Expected: 94 calls / 4 providers = 23.5 calls per provider
      const expectedCallsPerProvider = ((5 + 2) * 12 + 10) / 4;
      expect(result.debug?.callsPerProvider).toBeCloseTo(expectedCallsPerProvider, 1);
    });

    test('total budget equals average per provider times number of providers', () => {
      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      const expectedTotal = result.avgCallPayPerProvider * program.providersOnCall;
      expect(result.totalAnnualCallBudget).toBeCloseTo(expectedTotal, 2);
    });

    test('call pay per FTE equals total budget divided by total FTE', () => {
      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      const totalFTE = providers.reduce((sum, p) => sum + p.fte, 0);
      const expectedPerFTE = result.totalAnnualCallBudget / totalFTE;
      expect(result.callPayPerFTE).toBeCloseTo(expectedPerFTE, 2);
    });
  });

  describe('Edge Cases', () => {
    test('returns zero budget when no tier is available', () => {
      const program: CallProgram = {
        modelYear: 2024,
        specialty: 'Cardiology',
        providersOnCall: 4,
      };

      const providers: CallProvider[] = [
        { id: 'p1', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      ];

      const tiers: CallTier[] = [];
      const assumptions: CallAssumptions = {
        weekdayCallsPerMonth: 5,
        weekendCallsPerMonth: 2,
        holidaysPerYear: 10,
      };

      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      expect(result.totalAnnualCallBudget).toBe(0);
      expect(result.avgCallPayPerProvider).toBe(0);
      expect(result.debug?.error).toBe('No tier available');
    });

    test('returns zero budget when no eligible providers', () => {
      const program: CallProgram = {
        modelYear: 2024,
        specialty: 'Cardiology',
        providersOnCall: 4,
      };

      const providers: CallProvider[] = [
        { id: 'p1', fte: 1.0, tierId: 'C1', eligibleForCall: false },
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

      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      expect(result.totalAnnualCallBudget).toBe(0);
      expect(result.avgCallPayPerProvider).toBe(0);
      expect(result.debug?.error).toBe('No eligible providers');
    });

    test('uses first enabled tier when multiple tiers exist', () => {
      const program: CallProgram = {
        modelYear: 2024,
        specialty: 'Cardiology',
        providersOnCall: 4,
      };

      const providers: CallProvider[] = [
        { id: 'p1', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      ];

      const tiers: CallTier[] = [
        {
          id: 'C1',
          coverageType: 'In-house',
          paymentMethod: 'Daily',
          baseRate: 500,
          enabled: true,
        },
        {
          id: 'C2',
          coverageType: 'In-house',
          paymentMethod: 'Daily',
          baseRate: 600,
          enabled: true,
        },
      ];

      const assumptions: CallAssumptions = {
        weekdayCallsPerMonth: 5,
        weekendCallsPerMonth: 2,
        holidaysPerYear: 10,
      };

      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      // Should use C1 (first enabled tier)
      expect(result.debug?.activeTierId).toBe('C1');
      expect(result.debug?.rates.weekday).toBe(500);
    });

    test('applies weekend and holiday uplifts correctly', () => {
      const program: CallProgram = {
        modelYear: 2024,
        specialty: 'Cardiology',
        providersOnCall: 4,
      };

      const providers: CallProvider[] = [
        { id: 'p1', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      ];

      const tiers: CallTier[] = [
        {
          id: 'C1',
          coverageType: 'In-house',
          paymentMethod: 'Daily',
          baseRate: 500,
          weekendUpliftPct: 20, // 20% uplift
          holidayUpliftPct: 50, // 50% uplift
          enabled: true,
        },
      ];

      const assumptions: CallAssumptions = {
        weekdayCallsPerMonth: 5,
        weekendCallsPerMonth: 2,
        holidaysPerYear: 10,
      };

      const result = calculateCallBudget(program, providers, tiers, assumptions);
      
      // Weekend rate should be 500 * 1.20 = 600
      expect(result.debug?.rates.weekend).toBe(600);
      
      // Holiday rate should be 500 * 1.50 = 750
      expect(result.debug?.rates.holiday).toBe(750);
    });
  });
});







