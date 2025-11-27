/**
 * Call Pay Scenario Utilities
 * 
 * Helper functions for creating and managing call pay scenarios
 */

import { CallScenario } from '@/types/call-scenarios';
import {
  CallProgram,
  CallProvider,
  CallTier as EngineCallTier,
  CallAssumptions,
  BudgetResult,
} from '@/types/call-pay-engine';
import { CallPayContext, CallTier as UICallTier } from '@/types/call-pay';
import { calculateCallBudget } from '@/lib/utils/call-pay-engine';
import { mapCallPayStateToEngineInputs } from '@/lib/utils/call-pay-adapter';
import { calculateExpectedBurden, calculateFairnessMetrics } from '@/lib/utils/burden-calculations';
import { evaluateFMV } from '@/lib/utils/fmv-evaluator';

/**
 * Create a CallScenario snapshot from current model state
 */
export function createScenarioFromCurrentState(
  name: string,
  context: CallPayContext,
  uiTiers: UICallTier[],
  providers: CallProvider[],
  existingId?: string
): CallScenario {
  // Map UI state to engine inputs
  const engineInputs = mapCallPayStateToEngineInputs(context, uiTiers, providers);
  
  // Calculate budget result
  const budgetResult = calculateCallBudget(
    engineInputs.program,
    engineInputs.providers,
    engineInputs.tiers,
    engineInputs.assumptions
  );
  
  // Calculate burden summary
  let burdenSummary;
  try {
    const burdenResults = calculateExpectedBurden(providers, engineInputs.assumptions);
    burdenSummary = calculateFairnessMetrics(burdenResults);
  } catch (error) {
    console.warn('Error calculating burden summary:', error);
  }
  
  // Calculate FMV summary
  let fmvSummary;
  try {
    const activeTier = uiTiers.find(t => t.enabled) || uiTiers[0];
    const coverageType = activeTier?.coverageType || 'In-house';
    
    const fmvResult = evaluateFMV({
      specialty: context.specialty || '',
      coverageType,
      effectiveRatePer24h: budgetResult.effectivePer24h,
      burdenScore: burdenSummary?.fairnessScore,
    });
    
    fmvSummary = {
      riskLevel: fmvResult.riskLevel,
      percentileEstimate: fmvResult.percentileEstimate,
      effectiveRatePer24h: budgetResult.effectivePer24h,
    };
  } catch (error) {
    console.warn('Error calculating FMV summary:', error);
  }
  
  const now = new Date().toISOString();
  
  return {
    id: existingId || `call-pay-${Date.now()}`,
    name,
    createdAt: existingId ? now : now, // Keep original createdAt if updating
    updatedAt: now,
    
    // Inputs
    program: engineInputs.program,
    providers: engineInputs.providers,
    tiers: engineInputs.tiers,
    assumptions: engineInputs.assumptions,
    
    // UI state
    context,
    uiTiers,
    
    // Outputs
    budgetResult,
    burdenSummary,
    fmvSummary,
  };
}

/**
 * Hydrate model state from a CallScenario
 */
export function hydrateStateFromScenario(scenario: CallScenario): {
  context: CallPayContext;
  tiers: UICallTier[];
  providers: CallProvider[];
} {
  return {
    context: scenario.context,
    tiers: scenario.uiTiers,
    providers: scenario.providers,
  };
}


