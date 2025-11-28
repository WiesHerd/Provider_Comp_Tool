/**
 * Call Pay Engine Adapter - Test Suite
 */

import { mapCallPayStateToEngineInputs } from '../call-pay-adapter';
import { CallPayContext } from '@/types/call-pay';
import { CallProvider } from '@/types/call-pay-engine';

describe('mapCallPayStateToEngineInputs', () => {
  const baseContext: CallPayContext = {
    specialty: 'Cardiology',
    serviceLine: 'Cardiac Surgery',
    providersOnCall: 4,
    rotationRatio: 4,
    modelYear: 2024,
  };

  const baseProviders: CallProvider[] = [
    { id: 'p1', name: 'Provider 1', fte: 1.0, tierId: 'C1', eligibleForCall: true },
    { id: 'p2', name: 'Provider 2', fte: 1.0, tierId: 'C1', eligibleForCall: true },
    { id: 'p3', name: 'Provider 3', fte: 1.0, tierId: 'C1', eligibleForCall: true },
    { id: 'p4', name: 'Provider 4', fte: 1.0, tierId: 'C1', eligibleForCall: true },
  ];

  const baseTiers = [
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

  test('maps context to program correctly', () => {
    const result = mapCallPayStateToEngineInputs(baseContext, baseProviders, baseTiers);

    expect(result.program.modelYear).toBe(2024);
    expect(result.program.specialty).toBe('Cardiology');
    expect(result.program.serviceLine).toBe('Cardiac Surgery');
    expect(result.program.rotationRatio).toBe('1-in-4');
  });

  test('derives providersOnCall from eligible providers', () => {
    const providersWithIneligible: CallProvider[] = [
      ...baseProviders,
      { id: 'p5', name: 'Provider 5', fte: 1.0, tierId: 'C1', eligibleForCall: false },
    ];

    const result = mapCallPayStateToEngineInputs(
      baseContext,
      providersWithIneligible,
      baseTiers
    );

    // Should use eligible count (4), not total count (5)
    expect(result.program.providersOnCall).toBe(4);
  });

  test('falls back to context.providersOnCall if no eligible providers', () => {
    const ineligibleProviders: CallProvider[] = baseProviders.map(p => ({
      ...p,
      eligibleForCall: false,
    }));

    const result = mapCallPayStateToEngineInputs(
      baseContext,
      ineligibleProviders,
      baseTiers
    );

    // Should fall back to context value
    expect(result.program.providersOnCall).toBe(4);
  });

  test('maps tiers to engine format correctly', () => {
    const result = mapCallPayStateToEngineInputs(baseContext, baseProviders, baseTiers);

    expect(result.tiers).toHaveLength(1);
    expect(result.tiers[0].id).toBe('C1');
    expect(result.tiers[0].baseRate).toBe(500);
    expect(result.tiers[0].weekendUpliftPct).toBe(20);
    expect(result.tiers[0].holidayUpliftPct).toBe(60);
    expect(result.tiers[0].enabled).toBe(true);
  });

  test('extracts assumptions from first enabled tier', () => {
    const result = mapCallPayStateToEngineInputs(baseContext, baseProviders, baseTiers);

    expect(result.assumptions.weekdayCallsPerMonth).toBe(5);
    expect(result.assumptions.weekendCallsPerMonth).toBe(2);
    expect(result.assumptions.holidaysPerYear).toBe(10);
  });

  test('uses first tier if no enabled tier exists', () => {
    const disabledTiers = baseTiers.map(t => ({ ...t, enabled: false }));

    const result = mapCallPayStateToEngineInputs(baseContext, baseProviders, disabledTiers);

    expect(result.assumptions.weekdayCallsPerMonth).toBe(5);
  });

  test('returns zero assumptions if no tiers exist', () => {
    const result = mapCallPayStateToEngineInputs(baseContext, baseProviders, []);

    expect(result.assumptions.weekdayCallsPerMonth).toBe(0);
    expect(result.assumptions.weekendCallsPerMonth).toBe(0);
    expect(result.assumptions.holidaysPerYear).toBe(0);
  });

  test('preserves all provider data', () => {
    const result = mapCallPayStateToEngineInputs(baseContext, baseProviders, baseTiers);

    expect(result.providers).toHaveLength(4);
    expect(result.providers[0].id).toBe('p1');
    expect(result.providers[0].name).toBe('Provider 1');
    expect(result.providers[0].fte).toBe(1.0);
    expect(result.providers[0].tierId).toBe('C1');
    expect(result.providers[0].eligibleForCall).toBe(true);
  });

  test('handles optional serviceLine', () => {
    const contextWithoutServiceLine: CallPayContext = {
      ...baseContext,
      serviceLine: '',
    };

    const result = mapCallPayStateToEngineInputs(
      contextWithoutServiceLine,
      baseProviders,
      baseTiers
    );

    expect(result.program.serviceLine).toBeUndefined();
  });

  test('handles zero rotationRatio', () => {
    const contextWithoutRotation: CallPayContext = {
      ...baseContext,
      rotationRatio: 0,
    };

    const result = mapCallPayStateToEngineInputs(
      contextWithoutRotation,
      baseProviders,
      baseTiers
    );

    expect(result.program.rotationRatio).toBeUndefined();
  });
});



