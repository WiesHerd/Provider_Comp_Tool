import {
  calculateExpectedBurden,
  calculateFairnessMetrics,
  ProviderBurdenResult,
  FairnessSummary,
} from '../burden-calculations';
import { CallProvider, CallAssumptions } from '@/types/call-pay-engine';

describe('Burden Calculations', () => {
  const mockAssumptions: CallAssumptions = {
    weekdayCallsPerMonth: 5,
    weekendCallsPerMonth: 2,
    holidaysPerYear: 10,
  };

  describe('calculateExpectedBurden', () => {
    it('should return empty array when no eligible providers', () => {
      const providers: CallProvider[] = [
        { id: '1', fte: 1.0, tierId: 'C1', eligibleForCall: false },
        { id: '2', fte: 0.8, tierId: 'C1', eligibleForCall: false },
      ];

      const result = calculateExpectedBurden(providers, mockAssumptions);
      expect(result).toEqual([]);
    });

    it('should calculate expected burden for single provider', () => {
      const providers: CallProvider[] = [
        { id: '1', name: 'Dr. Smith', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      ];

      const result = calculateExpectedBurden(providers, mockAssumptions);
      
      expect(result).toHaveLength(1);
      expect(result[0].providerId).toBe('1');
      expect(result[0].providerName).toBe('Dr. Smith');
      expect(result[0].fte).toBe(1.0);
      
      // Total calls = (5 * 12) + (2 * 12) + 10 = 60 + 24 + 10 = 94
      expect(result[0].totalExpectedCalls).toBe(94);
      expect(result[0].expectedWeekdayCalls).toBe(60);
      expect(result[0].expectedWeekendCalls).toBe(24);
      expect(result[0].expectedHolidayCalls).toBe(10);
      expect(result[0].burdenIndex).toBe(0); // Single provider = group average
    });

    it('should distribute calls proportionally by FTE', () => {
      const providers: CallProvider[] = [
        { id: '1', name: 'Dr. Smith', fte: 1.0, tierId: 'C1', eligibleForCall: true },
        { id: '2', name: 'Dr. Jones', fte: 0.5, tierId: 'C1', eligibleForCall: true },
      ];

      const result = calculateExpectedBurden(providers, mockAssumptions);
      
      expect(result).toHaveLength(2);
      
      // Total FTE = 1.5
      // Provider 1 share = 1.0 / 1.5 = 0.6667
      // Provider 2 share = 0.5 / 1.5 = 0.3333
      // Total calls = 94
      
      const provider1 = result.find(r => r.providerId === '1')!;
      const provider2 = result.find(r => r.providerId === '2')!;
      
      expect(provider1.totalExpectedCalls).toBeCloseTo(94 * (1.0 / 1.5), 1);
      expect(provider2.totalExpectedCalls).toBeCloseTo(94 * (0.5 / 1.5), 1);
      
      // Burden index: Provider 1 should be above average, Provider 2 below
      expect(provider1.burdenIndex).toBeGreaterThan(0);
      expect(provider2.burdenIndex).toBeLessThan(0);
    });

    it('should filter out ineligible providers', () => {
      const providers: CallProvider[] = [
        { id: '1', name: 'Dr. Smith', fte: 1.0, tierId: 'C1', eligibleForCall: true },
        { id: '2', name: 'Dr. Jones', fte: 0.8, tierId: 'C1', eligibleForCall: false },
        { id: '3', name: 'Dr. Brown', fte: 0.5, tierId: 'C1', eligibleForCall: true },
      ];

      const result = calculateExpectedBurden(providers, mockAssumptions);
      
      expect(result).toHaveLength(2);
      expect(result.map(r => r.providerId)).toEqual(['1', '3']);
      
      // Total FTE should only include eligible providers (1.0 + 0.5 = 1.5)
      const totalCalls = result.reduce((sum, r) => sum + r.totalExpectedCalls, 0);
      expect(totalCalls).toBeCloseTo(94, 1);
    });

    it('should handle zero FTE providers gracefully', () => {
      const providers: CallProvider[] = [
        { id: '1', name: 'Dr. Smith', fte: 1.0, tierId: 'C1', eligibleForCall: true },
        { id: '2', name: 'Dr. Jones', fte: 0, tierId: 'C1', eligibleForCall: true },
      ];

      const result = calculateExpectedBurden(providers, mockAssumptions);
      
      expect(result).toHaveLength(2);
      const provider1 = result.find(r => r.providerId === '1')!;
      const provider2 = result.find(r => r.providerId === '2')!;
      
      // Provider 1 should get all calls
      expect(provider1.totalExpectedCalls).toBe(94);
      expect(provider2.totalExpectedCalls).toBe(0);
    });

    it('should calculate burden index correctly', () => {
      const providers: CallProvider[] = [
        { id: '1', fte: 1.0, tierId: 'C1', eligibleForCall: true },
        { id: '2', fte: 1.0, tierId: 'C1', eligibleForCall: true },
        { id: '3', fte: 0.5, tierId: 'C1', eligibleForCall: true },
      ];

      const result = calculateExpectedBurden(providers, mockAssumptions);
      
      // Group average = 94 / 3 = 31.33
      // Provider 1 & 2: 94 * (1.0 / 2.5) = 37.6, index = (37.6 - 31.33) / 31.33 * 100 = ~20%
      // Provider 3: 94 * (0.5 / 2.5) = 18.8, index = (18.8 - 31.33) / 31.33 * 100 = ~-40%
      
      const provider1 = result.find(r => r.providerId === '1')!;
      const provider3 = result.find(r => r.providerId === '3')!;
      
      expect(provider1.burdenIndex).toBeGreaterThan(0);
      expect(provider3.burdenIndex).toBeLessThan(0);
    });
  });

  describe('calculateFairnessMetrics', () => {
    it('should return default values for empty array', () => {
      const result = calculateFairnessMetrics([]);
      
      expect(result.groupAverageCalls).toBe(0);
      expect(result.minCalls).toBe(0);
      expect(result.maxCalls).toBe(0);
      expect(result.averageCalls).toBe(0);
      expect(result.standardDeviation).toBe(0);
      expect(result.fairnessScore).toBe(100);
      expect(result.totalEligibleFTE).toBe(0);
      expect(result.eligibleProviderCount).toBe(0);
    });

    it('should calculate metrics for equal distribution', () => {
      const burdenResults: ProviderBurdenResult[] = [
        {
          providerId: '1',
          providerName: 'Dr. Smith',
          fte: 1.0,
          expectedWeekdayCalls: 30,
          expectedWeekendCalls: 12,
          expectedHolidayCalls: 5,
          totalExpectedCalls: 47,
          burdenIndex: 0,
        },
        {
          providerId: '2',
          providerName: 'Dr. Jones',
          fte: 1.0,
          expectedWeekdayCalls: 30,
          expectedWeekendCalls: 12,
          expectedHolidayCalls: 5,
          totalExpectedCalls: 47,
          burdenIndex: 0,
        },
      ];

      const result = calculateFairnessMetrics(burdenResults);
      
      expect(result.groupAverageCalls).toBe(47);
      expect(result.minCalls).toBe(47);
      expect(result.maxCalls).toBe(47);
      expect(result.averageCalls).toBe(47);
      expect(result.standardDeviation).toBe(0);
      expect(result.fairnessScore).toBe(100); // Perfect fairness
      expect(result.totalEligibleFTE).toBe(2.0);
      expect(result.eligibleProviderCount).toBe(2);
    });

    it('should calculate metrics for unequal distribution', () => {
      const burdenResults: ProviderBurdenResult[] = [
        {
          providerId: '1',
          fte: 1.0,
          expectedWeekdayCalls: 40,
          expectedWeekendCalls: 16,
          expectedHolidayCalls: 6,
          totalExpectedCalls: 62,
          burdenIndex: 20,
        },
        {
          providerId: '2',
          fte: 0.5,
          expectedWeekdayCalls: 20,
          expectedWeekendCalls: 8,
          expectedHolidayCalls: 3,
          totalExpectedCalls: 31,
          burdenIndex: -40,
        },
      ];

      const result = calculateFairnessMetrics(burdenResults);
      
      expect(result.groupAverageCalls).toBe(46.5); // (62 + 31) / 2
      expect(result.minCalls).toBe(31);
      expect(result.maxCalls).toBe(62);
      expect(result.averageCalls).toBe(46.5);
      expect(result.standardDeviation).toBeGreaterThan(0);
      expect(result.fairnessScore).toBeLessThan(100); // Not perfectly fair
      expect(result.totalEligibleFTE).toBe(1.5);
      expect(result.eligibleProviderCount).toBe(2);
    });

    it('should handle single provider', () => {
      const burdenResults: ProviderBurdenResult[] = [
        {
          providerId: '1',
          fte: 1.0,
          expectedWeekdayCalls: 60,
          expectedWeekendCalls: 24,
          expectedHolidayCalls: 10,
          totalExpectedCalls: 94,
          burdenIndex: 0,
        },
      ];

      const result = calculateFairnessMetrics(burdenResults);
      
      expect(result.groupAverageCalls).toBe(94);
      expect(result.minCalls).toBe(94);
      expect(result.maxCalls).toBe(94);
      expect(result.standardDeviation).toBe(0);
      expect(result.fairnessScore).toBe(100);
      expect(result.eligibleProviderCount).toBe(1);
    });

    it('should calculate fairness score inversely related to variance', () => {
      // Test case 1: Low variance (more fair)
      const lowVarianceResults: ProviderBurdenResult[] = [
        { providerId: '1', fte: 1.0, expectedWeekdayCalls: 30, expectedWeekendCalls: 12, expectedHolidayCalls: 5, totalExpectedCalls: 47, burdenIndex: 0 },
        { providerId: '2', fte: 1.0, expectedWeekdayCalls: 31, expectedWeekendCalls: 12, expectedHolidayCalls: 5, totalExpectedCalls: 48, burdenIndex: 2 },
      ];

      // Test case 2: High variance (less fair)
      const highVarianceResults: ProviderBurdenResult[] = [
        { providerId: '1', fte: 1.0, expectedWeekdayCalls: 50, expectedWeekendCalls: 20, expectedHolidayCalls: 8, totalExpectedCalls: 78, burdenIndex: 50 },
        { providerId: '2', fte: 0.2, expectedWeekdayCalls: 10, expectedWeekendCalls: 4, expectedHolidayCalls: 2, totalExpectedCalls: 16, burdenIndex: -70 },
      ];

      const lowVarianceScore = calculateFairnessMetrics(lowVarianceResults).fairnessScore;
      const highVarianceScore = calculateFairnessMetrics(highVarianceResults).fairnessScore;

      expect(lowVarianceScore).toBeGreaterThan(highVarianceScore);
      expect(lowVarianceScore).toBeGreaterThan(80); // Should be high for low variance
      expect(highVarianceScore).toBeLessThan(80); // Should be lower for high variance
    });
  });
});










