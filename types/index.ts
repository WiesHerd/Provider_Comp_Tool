export type FTE = number; // 0.0 - 1.0

export type TCCComponentType =
  | "Base Salary"
  | "Quality Incentive"
  | "Productivity Incentive"
  | "Call Pay"
  | "Admin Stipend"
  | "Other"
  | "Custom"; // Custom allows free-form entry

export type TCCCalculationMethod = "fixed" | "percentage";

export interface TCCComponent {
  id: string;
  label: string;
  type: TCCComponentType;
  calculationMethod?: TCCCalculationMethod; // "fixed" or "percentage"
  amount: number; // annual $ amount (calculated if percentage)
  percentage?: number; // percentage of base pay (0-100)
  fixedAmount?: number; // fixed dollar amount (when method is "fixed")
}

export interface MarketBenchmarks {
  tcc25?: number;
  tcc50?: number;
  tcc75?: number;
  tcc90?: number;
  cf25?: number;
  cf50?: number;
  cf75?: number;
  cf90?: number;
  wrvu25?: number;
  wrvu50?: number;
  wrvu75?: number;
  wrvu90?: number;
}

export type ScenarioType = 'wrvu-modeler' | 'fmv-tcc' | 'fmv-wrvu' | 'fmv-cf' | 'call-pay' | 'general';

// Export call pay types
export * from './call-pay';

// Extended interface for call-pay scenarios
export interface CallPayScenarioData {
  context: import('./call-pay').CallPayContext;
  tiers: import('./call-pay').CallTier[];
  impact: {
    totalAnnualCallSpend: number;
    averageCallPayPerProvider: number;
    callPayPer1FTE: number;
  };
}

export interface ProviderScenario {
  id: string;
  name: string;
  scenarioType?: ScenarioType; // Type of scenario to identify which screen it belongs to
  providerName?: string; // Optional provider name
  specialty?: string; // Optional specialty
  fte: FTE;
  annualWrvus: number;
  monthlyWrvus?: number; // Monthly average wRVUs
  monthlyBreakdown?: number[]; // Array of 12 monthly wRVU values
  tccComponents: TCCComponent[];
  totalTcc?: number; // auto-calculated
  normalizedTcc?: number; // normalized to 1.0 FTE
  normalizedWrvus?: number; // normalized to 1.0 FTE
  cfValue?: number; // Conversion factor value
  marketBenchmarks?: MarketBenchmarks;
  computedPercentiles?: {
    tccPercentile?: number;
    wrvuPercentile?: number;
    cfPercentile?: number;
  };
  dismissedFromRecent?: boolean; // Flag to hide from Recent section without deleting
  createdAt: string;
  updatedAt: string;
  callPayData?: CallPayScenarioData; // Call-pay specific data for restoration
}

