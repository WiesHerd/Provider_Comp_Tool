import {
  calculatePerCallStipend,
  calculatePerShiftPay,
  calculateTieredCallPay,
} from '../call-pay';

describe('call pay calculations', () => {
  describe('calculatePerCallStipend', () => {
    it('should calculate per-call stipend correctly', () => {
      const inputs = {
        weekdayCallsPerMonth: 10,
        weekendCallsPerMonth: 5,
        weekdayStipend: 500,
        weekendStipend: 750,
      };

      const result = calculatePerCallStipend(inputs);
      expect(result.monthlyPay).toBe(8750);
      expect(result.annualPay).toBe(105000);
      expect(result.effectiveRate).toBeCloseTo(583.33, 2);
    });
  });

  describe('calculatePerShiftPay', () => {
    it('should calculate per-shift pay correctly', () => {
      const inputs = {
        weekdayShiftsPerMonth: 8,
        weekendShiftsPerMonth: 4,
        weekdayRate: 1000,
        weekendRate: 1500,
      };

      const result = calculatePerShiftPay(inputs);
      expect(result.monthlyPay).toBe(14000);
      expect(result.annualPay).toBe(168000);
      expect(result.effectiveRate).toBeCloseTo(1166.67, 2);
    });
  });

  describe('calculateTieredCallPay', () => {
    it('should calculate tiered pay below threshold', () => {
      const inputs = {
        threshold: 10,
        rateBelowThreshold: 500,
        rateAboveThreshold: 750,
        actualCallsOrShifts: 8,
      };

      const result = calculateTieredCallPay(inputs);
      expect(result.monthlyPay).toBe(4000);
      expect(result.annualPay).toBe(48000);
    });

    it('should calculate tiered pay above threshold', () => {
      const inputs = {
        threshold: 10,
        rateBelowThreshold: 500,
        rateAboveThreshold: 750,
        actualCallsOrShifts: 15,
      };

      const result = calculateTieredCallPay(inputs);
      expect(result.monthlyPay).toBe(8750); // 10 * 500 + 5 * 750
      expect(result.annualPay).toBe(105000);
    });
  });
});















