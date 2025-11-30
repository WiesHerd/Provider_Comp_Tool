/**
 * Call Pay Engine Integration Test
 * 
 * Tests the full flow: adapter -> engine -> result validation
 */

import { mapCallPayStateToEngineInputs } from '../call-pay-adapter';
import { calculateCallBudget } from '../call-pay-engine';
import { CallPayContext } from '@/types/call-pay';
import { CallProvider } from '@/types/call-pay-engine';

describe('Call Pay Engine Integration', () => {
  test('happy path: 4 eligible providers, 1 tier, standard assumptions', () => {
    const context: CallPayContext = {
      specialty: 'Cardiology',
      serviceLine: 'Cardiac Surgery',
      providersOnCall: 4,
      rotationRatio: 4,
      modelYear: 2024,
    };

    const providers: CallProvider[] = [
      { id: 'p1', name: 'Provider 1', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      { id: 'p2', name: 'Provider 2', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      { id: 'p3', name: 'Provider 3', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      { id: 'p4', name: 'Provider 4', fte: 1.0, tierId: 'C1', eligibleForCall: true },
    ];

    const tiers = [
      {
        id: 'C1',
        name: 'C1',
        coverageType: 'In-house' as const,
        paymentMethod: 'Daily / shift rate' as const,
        rates: {
          weekday: 500,
          weekend: 600,
          holiday: 800,
          weekendUpliftPercent: 20,
          holidayUpliftPercent: 60,
        },
        burden: {
          weekdayCallsPerMonth: 5,
          weekendCallsPerMonth: 2,
          holidaysPerYear: 10,
          avgCallbacksPer24h: 2.5,
        },
        enabled: true,
      },
    ];

    // Step 1: Map UI state to engine inputs
    const engineInputs = mapCallPayStateToEngineInputs(context, providers, tiers);

    // Step 2: Calculate budget using engine
    const result = calculateCallBudget(
      engineInputs.program,
      engineInputs.providers,
      engineInputs.tiers,
      engineInputs.assumptions
    );

    // Step 3: Validate results
    expect(result.totalAnnualCallBudget).toBeGreaterThan(0);
    expect(result.avgCallPayPerProvider).toBeGreaterThan(0);
    expect(result.callPayPerFTE).toBeGreaterThan(0);
    expect(result.effectivePer24h).toBeGreaterThan(0);
    expect(result.effectivePerCall).toBeGreaterThan(0);

    // All values should be finite numbers
    expect(isFinite(result.totalAnnualCallBudget)).toBe(true);
    expect(isFinite(result.avgCallPayPerProvider)).toBe(true);
    expect(isFinite(result.callPayPerFTE)).toBe(true);
    expect(isFinite(result.effectivePer24h)).toBe(true);
    expect(isFinite(result.effectivePerCall)).toBe(true);

    // Verify relationships
    // Total budget should equal average per provider times number of providers
    const expectedTotal = result.avgCallPayPerProvider * engineInputs.program.providersOnCall;
    expect(result.totalAnnualCallBudget).toBeCloseTo(expectedTotal, 2);

    // Call pay per FTE should be reasonable (for 1.0 FTE providers, should be close to avg per provider)
    // With all providers at 1.0 FTE, callPayPerFTE should equal total budget / total FTE
    const totalFTE = providers.reduce((sum, p) => sum + p.fte, 0);
    const expectedPerFTE = result.totalAnnualCallBudget / totalFTE;
    expect(result.callPayPerFTE).toBeCloseTo(expectedPerFTE, 2);
  });

  test('handles mixed FTE providers correctly', () => {
    const context: CallPayContext = {
      specialty: 'Cardiology',
      serviceLine: '',
      providersOnCall: 3,
      rotationRatio: 3,
      modelYear: 2024,
    };

    const providers: CallProvider[] = [
      { id: 'p1', name: 'Provider 1', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      { id: 'p2', name: 'Provider 2', fte: 0.75, tierId: 'C1', eligibleForCall: true },
      { id: 'p3', name: 'Provider 3', fte: 0.5, tierId: 'C1', eligibleForCall: true },
    ];

    const tiers = [
      {
        id: 'C1',
        name: 'C1',
        coverageType: 'In-house' as const,
        paymentMethod: 'Daily / shift rate' as const,
        rates: {
          weekday: 500,
          weekend: 600,
          holiday: 800,
        },
        burden: {
          weekdayCallsPerMonth: 5,
          weekendCallsPerMonth: 2,
          holidaysPerYear: 10,
          avgCallbacksPer24h: 2.5,
        },
        enabled: true,
      },
    ];

    const engineInputs = mapCallPayStateToEngineInputs(context, providers, tiers);
    const result = calculateCallBudget(
      engineInputs.program,
      engineInputs.providers,
      engineInputs.tiers,
      engineInputs.assumptions
    );

    // Should calculate correctly with mixed FTE
    expect(result.totalAnnualCallBudget).toBeGreaterThan(0);
    expect(result.callPayPerFTE).toBeGreaterThan(0);

    // Total FTE = 1.0 + 0.75 + 0.5 = 2.25
    const totalFTE = providers.reduce((sum, p) => sum + p.fte, 0);
    expect(totalFTE).toBe(2.25);
    
    // Call pay per FTE should equal total budget / total FTE
    const expectedPerFTE = result.totalAnnualCallBudget / totalFTE;
    expect(result.callPayPerFTE).toBeCloseTo(expectedPerFTE, 2);
  });

  test('handles ineligible providers correctly', () => {
    const context: CallPayContext = {
      specialty: 'Cardiology',
      serviceLine: '',
      providersOnCall: 4,
      rotationRatio: 4,
      modelYear: 2024,
    };

    const providers: CallProvider[] = [
      { id: 'p1', name: 'Provider 1', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      { id: 'p2', name: 'Provider 2', fte: 1.0, tierId: 'C1', eligibleForCall: true },
      { id: 'p3', name: 'Provider 3', fte: 1.0, tierId: 'C1', eligibleForCall: false },
      { id: 'p4', name: 'Provider 4', fte: 1.0, tierId: 'C1', eligibleForCall: false },
    ];

    const tiers = [
      {
        id: 'C1',
        name: 'C1',
        coverageType: 'In-house' as const,
        paymentMethod: 'Daily / shift rate' as const,
        rates: {
          weekday: 500,
          weekend: 600,
          holiday: 800,
        },
        burden: {
          weekdayCallsPerMonth: 5,
          weekendCallsPerMonth: 2,
          holidaysPerYear: 10,
          avgCallbacksPer24h: 2.5,
        },
        enabled: true,
      },
    ];

    const engineInputs = mapCallPayStateToEngineInputs(context, providers, tiers);
    
    // Should only count eligible providers
    expect(engineInputs.program.providersOnCall).toBe(2);

    const result = calculateCallBudget(
      engineInputs.program,
      engineInputs.providers,
      engineInputs.tiers,
      engineInputs.assumptions
    );

    // Budget should be calculated for 2 providers, not 4
    expect(result.totalAnnualCallBudget).toBeGreaterThan(0);
    expect(result.avgCallPayPerProvider).toBeGreaterThan(0);
  });
});




