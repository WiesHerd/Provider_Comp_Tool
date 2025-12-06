/**
 * Call Pay Engine Adapter
 * 
 * Maps existing Call Pay Modeler UI state to engine input types.
 * This adapter layer allows the UI to use the pure engine function
 * without duplicating types or logic.
 */

import {
  CallProgram,
  CallProvider,
  CallTier as EngineCallTier,
  CallAssumptions,
} from '@/types/call-pay-engine';
import {
  CallPayContext,
  CallTier as UICallTier,
} from '@/types/call-pay';

export interface EngineInputs {
  program: CallProgram;
  providers: CallProvider[];
  tiers: EngineCallTier[];
  assumptions: CallAssumptions;
}

/**
 * Map UI CallTier to Engine CallTier
 */
function mapTierToEngine(uiTier: UICallTier): EngineCallTier {
  return {
    id: uiTier.id,
    coverageType: uiTier.coverageType,
    paymentMethod: uiTier.paymentMethod,
    baseRate: uiTier.rates.weekday,
    weekendUpliftPct: uiTier.rates.weekendUpliftPercent,
    holidayUpliftPct: uiTier.rates.holidayUpliftPercent,
    traumaUpliftPct: uiTier.rates.traumaUpliftPercent,
    enabled: uiTier.enabled,
  };
}

/**
 * Extract assumptions from the first enabled tier's burden
 * For Phase 2, we use the burden from the first enabled tier
 */
function extractAssumptions(tiers: UICallTier[]): CallAssumptions {
  const enabledTier = tiers.find(t => t.enabled) || tiers[0];
  
  if (!enabledTier || !enabledTier.burden) {
    return {
      weekdayCallsPerMonth: 0,
      weekendCallsPerMonth: 0,
      holidaysPerYear: 0,
    };
  }

  return {
    weekdayCallsPerMonth: enabledTier.burden.weekdayCallsPerMonth || 0,
    weekendCallsPerMonth: enabledTier.burden.weekendCallsPerMonth || 0,
    holidaysPerYear: enabledTier.burden.holidaysPerYear || 0,
  };
}

/**
 * Map Call Pay Modeler UI state to engine inputs
 * 
 * @param context - UI context (specialty, providersOnCall, etc.)
 * @param providers - Provider roster from UI state
 * @param tiers - UI tiers (with rates, burden, etc.)
 * @returns Engine inputs ready for calculateCallBudget
 */
export function mapCallPayStateToEngineInputs(
  context: CallPayContext,
  providers: CallProvider[],
  tiers: UICallTier[]
): EngineInputs {
  // Map tiers to engine format
  const engineTiers = tiers.map(mapTierToEngine);

  // Extract assumptions from tier burden
  const assumptions = extractAssumptions(tiers);

  // Build program from context
  // providersOnCall should be derived from eligible providers count
  const eligibleProvidersCount = providers.filter(p => p.eligibleForCall).length;
  const program: CallProgram = {
    modelYear: context.modelYear,
    specialty: context.specialty,
    serviceLine: context.serviceLine || undefined,
    providersOnCall: eligibleProvidersCount > 0 ? eligibleProvidersCount : context.providersOnCall,
    rotationRatio: context.rotationRatio > 0 ? `1-in-${context.rotationRatio}` : undefined,
  };

  return {
    program,
    providers,
    tiers: engineTiers,
    assumptions,
  };
}










