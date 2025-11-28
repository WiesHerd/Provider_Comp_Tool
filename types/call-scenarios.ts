/**
 * Call Pay Scenario Types
 * 
 * Types for managing and comparing call pay scenarios
 */

import {
  CallProgram,
  CallProvider,
  CallTier as EngineCallTier,
  CallAssumptions,
  BudgetResult,
} from '@/types/call-pay-engine';
import { CallPayContext, CallTier as UICallTier } from '@/types/call-pay';
import { FairnessSummary } from '@/lib/utils/burden-calculations';
import { FMVRiskLevel } from '@/types/fmv';

/**
 * Complete snapshot of a call pay model scenario
 */
export interface CallScenario {
  id: string;
  name: string;                       // e.g. "Current", "Proposed 2025", "+1 FTE"
  createdAt: string;                  // ISO timestamp
  updatedAt: string;                  // ISO timestamp

  // Snapshotted inputs (using engine types for consistency)
  program: CallProgram;
  providers: CallProvider[];
  tiers: EngineCallTier[];
  assumptions: CallAssumptions;

  // UI state (for restoration)
  context: CallPayContext;
  uiTiers: UICallTier[];

  // Cached outputs (computed at save time)
  budgetResult: BudgetResult;
  burdenSummary?: FairnessSummary;
  fmvSummary?: {
    riskLevel: FMVRiskLevel;
    percentileEstimate?: number;
    effectiveRatePer24h: number;
  };
}

/**
 * Scenario comparison metrics for table display
 */
export interface ScenarioComparison {
  id: string;
  name: string;
  totalCallBudget: number;
  callPayPerFTE: number;
  fairnessScore: number;
  fmvRiskLevel: FMVRiskLevel | 'N/A';
  effectiveRatePer24h: number;
  updatedAt: string;
}



