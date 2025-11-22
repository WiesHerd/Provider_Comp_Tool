/**
 * Call Pay & Coverage Modeler - Comprehensive Test Suite
 * Testing as Gallagher/SullivanCotter Consultant
 */

import {
  calculateTierAnnualPay,
  calculateCallPayImpact,
  calculateEffectiveDollarsPer24h,
  calculateEffectiveDollarsPerCall,
} from '../call-pay-coverage';
import { CallTier, CallPayContext } from '@/types/call-pay';

describe('Call Pay & Coverage Calculations', () => {
  const baseContext: CallPayContext = {
    specialty: 'Cardiology',
    serviceLine: 'Cardiac Surgery',
    providersOnCall: 8,
    rotationRatio: 4,
    modelYear: 2024,
  };

  describe('Scenario 1: Cardiology - Daily/Shift Rate Model', () => {
    const tier: CallTier = {
      id: 'C1',
      name: 'C1',
      coverageType: 'In-house',
      paymentMethod: 'Daily / shift rate',
      rates: {
        weekday: 500,
        weekend: 600,
        holiday: 800,
      },
      burden: {
        weekdayCallsPerMonth: 15,
        weekendCallsPerMonth: 4,
        holidaysPerYear: 8,
        avgCallbacksPer24h: 2.5,
      },
      enabled: true,
    };

    test('calculates monthly pay correctly', () => {
      const annualPay = calculateTierAnnualPay(tier, baseContext);
      
      // Expected: (15 × $500 + 4 × $600 + 8/12 × $800) / 4 rotation × 12 months
      // Monthly: ($7,500 + $2,400 + $533.33) = $10,433.33
      // Per provider (1-in-4): $10,433.33 / 4 = $2,608.33
      // Annual: $2,608.33 × 12 = $31,300
      
      expect(annualPay).toBeCloseTo(31299.96, 0);
    });

    test('calculates group budget correctly', () => {
      const impact = calculateCallPayImpact([tier], baseContext);
      const annualPerProvider = impact.tiers[0].annualPayPerProvider;
      const groupBudget = impact.tiers[0].annualPayForGroup;
      
      // Group budget = per provider × number of providers
      expect(groupBudget).toBeCloseTo(annualPerProvider * 8, 0);
      expect(groupBudget).toBeCloseTo(250399.68, 0);
    });

    test('calculates effective $/24h', () => {
      const effectiveRate = calculateEffectiveDollarsPer24h(tier, baseContext);
      const annualPay = calculateTierAnnualPay(tier, baseContext);
      const totalCallsPerYear = (15 + 4) * 12 + 8; // 236 calls/year
      
      expect(effectiveRate).toBeCloseTo(annualPay / totalCallsPerYear, 2);
    });
  });

  describe('Scenario 2: Anesthesiology - Annual Stipend', () => {
    const context: CallPayContext = {
      ...baseContext,
      specialty: 'Anesthesiology',
      providersOnCall: 12,
      rotationRatio: 6,
    };

    const tier: CallTier = {
      id: 'C1',
      name: 'C1',
      coverageType: 'In-house',
      paymentMethod: 'Annual stipend',
      rates: {
        weekday: 60000, // Annual stipend
        weekend: 0,
        holiday: 0,
      },
      burden: {
        weekdayCallsPerMonth: 0,
        weekendCallsPerMonth: 0,
        holidaysPerYear: 0,
        avgCallbacksPer24h: 0,
      },
      enabled: true,
    };

    test('calculates annual stipend with rotation', () => {
      const annualPay = calculateTierAnnualPay(tier, context);
      
      // Annual stipend $60,000 with 1-in-6 rotation
      // Per provider: $60,000 / 6 = $10,000
      expect(annualPay).toBeCloseTo(10000, 0);
    });

    test('calculates total group budget', () => {
      const impact = calculateCallPayImpact([tier], context);
      
      // 12 providers × $10,000 = $120,000
      expect(impact.totalAnnualCallSpend).toBeCloseTo(120000, 0);
    });
  });

  describe('Scenario 3: Multi-Tier Model with Trauma Uplift', () => {
    const c1Tier: CallTier = {
      id: 'C1',
      name: 'C1 - Trauma',
      coverageType: 'In-house',
      paymentMethod: 'Daily / shift rate',
      rates: {
        weekday: 800,
        weekend: 1000,
        holiday: 1200,
        traumaUpliftPercent: 15,
      },
      burden: {
        weekdayCallsPerMonth: 10,
        weekendCallsPerMonth: 3,
        holidaysPerYear: 6,
        avgCallbacksPer24h: 3.5,
      },
      enabled: true,
    };

    const c2Tier: CallTier = {
      id: 'C2',
      name: 'C2 - General',
      coverageType: 'Restricted home',
      paymentMethod: 'Daily / shift rate',
      rates: {
        weekday: 400,
        weekend: 500,
        holiday: 600,
      },
      burden: {
        weekdayCallsPerMonth: 12,
        weekendCallsPerMonth: 4,
        holidaysPerYear: 4,
        avgCallbacksPer24h: 1.5,
      },
      enabled: true,
    };

    test('applies trauma uplift correctly', () => {
      const c1Annual = calculateTierAnnualPay(c1Tier, baseContext);
      
      // Monthly before uplift: (10×$800 + 3×$1000 + 6/12×$1200) = $11,600
      // After 15% uplift: $11,600 × 1.15 = $13,340
      // Per provider (1-in-4): $13,340 / 4 = $3,335
      // Annual: $3,335 × 12 = $40,020
      
      expect(c1Annual).toBeCloseTo(40020, 0);
    });

    test('calculates combined multi-tier budget', () => {
      const impact = calculateCallPayImpact([c1Tier, c2Tier], baseContext);
      
      // Should sum both tiers
      expect(impact.tiers.length).toBe(2);
      expect(impact.totalAnnualCallSpend).toBeGreaterThan(0);
      
      // Verify it's sum of both tier group budgets
      const expectedTotal = impact.tiers[0].annualPayForGroup + impact.tiers[1].annualPayForGroup;
      expect(impact.totalAnnualCallSpend).toBeCloseTo(expectedTotal, 0);
    });
  });

  describe('Scenario 4: Per Procedure Payment', () => {
    const tier: CallTier = {
      id: 'C1',
      name: 'C1',
      coverageType: 'In-house',
      paymentMethod: 'Per procedure',
      rates: {
        weekday: 500, // Rate per procedure
        weekend: 500,
        holiday: 500,
      },
      burden: {
        weekdayCallsPerMonth: 10,
        weekendCallsPerMonth: 3,
        holidaysPerYear: 0,
        avgCallbacksPer24h: 0,
        avgCasesPer24h: 2.5, // Cases per 24h period
      },
      enabled: true,
    };

    test('calculates per procedure pay correctly', () => {
      const annualPay = calculateTierAnnualPay(tier, baseContext);
      
      // Cases per month: 2.5 cases × (10 + 3) calls = 32.5 cases/month
      // Monthly pay: 32.5 × $500 = $16,250
      // Per provider (1-in-4): $16,250 / 4 = $4,062.50
      // Annual: $4,062.50 × 12 = $48,750
      
      expect(annualPay).toBeCloseTo(48750, 0);
    });
  });

  describe('Edge Cases and Validation', () => {
    test('disabled tier returns zero', () => {
      const tier: CallTier = {
        ...baseContext,
        id: 'C1',
        name: 'C1',
        coverageType: 'In-house',
        paymentMethod: 'Daily / shift rate',
        rates: { weekday: 500, weekend: 600, holiday: 800 },
        burden: {
          weekdayCallsPerMonth: 15,
          weekendCallsPerMonth: 4,
          holidaysPerYear: 8,
          avgCallbacksPer24h: 2.5,
        },
        enabled: false,
      };

      expect(calculateTierAnnualPay(tier, baseContext)).toBe(0);
    });

    test('zero burden returns zero pay', () => {
      const tier: CallTier = {
        ...baseContext,
        id: 'C1',
        name: 'C1',
        coverageType: 'In-house',
        paymentMethod: 'Daily / shift rate',
        rates: { weekday: 500, weekend: 600, holiday: 800 },
        burden: {
          weekdayCallsPerMonth: 0,
          weekendCallsPerMonth: 0,
          holidaysPerYear: 0,
          avgCallbacksPer24h: 0,
        },
        enabled: true,
      };

      expect(calculateTierAnnualPay(tier, baseContext)).toBe(0);
    });

    test('handles different rotation ratios', () => {
      const tier: CallTier = {
        ...baseContext,
        id: 'C1',
        name: 'C1',
        coverageType: 'In-house',
        paymentMethod: 'Monthly retainer',
        rates: { weekday: 5000, weekend: 0, holiday: 0 },
        burden: {
          weekdayCallsPerMonth: 0,
          weekendCallsPerMonth: 0,
          holidaysPerYear: 0,
          avgCallbacksPer24h: 0,
        },
        enabled: true,
      };

      // Test 1-in-3 rotation
      const context1in3 = { ...baseContext, rotationRatio: 3 };
      const pay1in3 = calculateTierAnnualPay(tier, context1in3);
      
      // Test 1-in-6 rotation
      const context1in6 = { ...baseContext, rotationRatio: 6 };
      const pay1in6 = calculateTierAnnualPay(tier, context1in6);
      
      // 1-in-6 should be half of 1-in-3
      expect(pay1in6).toBeCloseTo(pay1in3 / 2, 0);
    });
  });

  describe('Budget Accuracy Tests', () => {
    test('total annual spend equals sum of tier budgets', () => {
      const tiers: CallTier[] = [
        {
          id: 'C1',
          name: 'C1',
          coverageType: 'In-house',
          paymentMethod: 'Daily / shift rate',
          rates: { weekday: 500, weekend: 600, holiday: 800 },
          burden: {
            weekdayCallsPerMonth: 10,
            weekendCallsPerMonth: 3,
            holidaysPerYear: 4,
            avgCallbacksPer24h: 2,
          },
          enabled: true,
        },
        {
          id: 'C2',
          name: 'C2',
          coverageType: 'Restricted home',
          paymentMethod: 'Daily / shift rate',
          rates: { weekday: 300, weekend: 400, holiday: 500 },
          burden: {
            weekdayCallsPerMonth: 8,
            weekendCallsPerMonth: 2,
            holidaysPerYear: 2,
            avgCallbacksPer24h: 1,
          },
          enabled: true,
        },
      ];

      const impact = calculateCallPayImpact(tiers, baseContext);
      
      // Verify total equals sum of individual tier group budgets
      const sumOfTiers = impact.tiers.reduce(
        (sum, tier) => sum + tier.annualPayForGroup,
        0
      );
      
      expect(impact.totalAnnualCallSpend).toBeCloseTo(sumOfTiers, 0);
    });
  });
});


