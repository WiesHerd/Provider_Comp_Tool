/**
 * Call Pay & Coverage Modeler Types
 */

export type Specialty = 
  // Primary Care / Hospital Medicine
  | 'Family Medicine'
  | 'Internal Medicine'
  | 'Hospitalist'
  | 'Pediatrics'
  // Procedural / Surgical
  | 'Anesthesiology'
  | 'General Surgery'
  | 'Orthopedic Surgery'
  | 'Neurosurgery'
  | 'Trauma Surgery'
  | 'Cardiothoracic Surgery'
  | 'Vascular Surgery'
  | 'Urology'
  | 'OB/GYN'
  | 'ENT (Otolaryngology)'
  | 'Ophthalmology'
  // Medical Subspecialties
  | 'Cardiology'
  | 'Critical Care'
  | 'Emergency Medicine'
  | 'Gastroenterology'
  | 'Nephrology'
  | 'Neurology'
  | 'Pulmonology'
  | 'Radiology'
  // Other
  | 'Psychiatry'
  | 'Pathology'
  | 'Other';

export type SpecialtyCategory = 'primary-care' | 'procedural' | 'medical-subspecialty' | 'other';

export type ModelingMode = "quick" | "advanced";

/**
 * Get the category of a specialty to determine appropriate call pay structures
 */
export function getSpecialtyCategory(specialty: Specialty): SpecialtyCategory {
  const primaryCare: Specialty[] = [
    'Family Medicine',
    'Internal Medicine',
    'Hospitalist',
    'Pediatrics',
  ];
  
  const procedural: Specialty[] = [
    'Anesthesiology',
    'General Surgery',
    'Orthopedic Surgery',
    'Neurosurgery',
    'Trauma Surgery',
    'Cardiothoracic Surgery',
    'Vascular Surgery',
    'Urology',
    'OB/GYN',
    'ENT (Otolaryngology)',
    'Ophthalmology',
  ];
  
  const medicalSubspecialty: Specialty[] = [
    'Cardiology',
    'Critical Care',
    'Emergency Medicine',
    'Gastroenterology',
    'Nephrology',
    'Neurology',
    'Pulmonology',
    'Radiology',
  ];
  
  if (primaryCare.includes(specialty)) return 'primary-care';
  if (procedural.includes(specialty)) return 'procedural';
  if (medicalSubspecialty.includes(specialty)) return 'medical-subspecialty';
  return 'other';
}

/**
 * Check if a specialty typically uses procedural call pay metrics
 */
export function isProceduralSpecialty(specialty: Specialty): boolean {
  return getSpecialtyCategory(specialty) === 'procedural';
}

export type CoverageType =
  | 'In-house'
  | 'Restricted home'
  | 'Unrestricted home'
  | 'Backup only';

export type PaymentMethod =
  | 'Annual stipend'
  | 'Daily / shift rate'
  | 'Hourly rate'
  | 'Monthly retainer'
  | 'Per procedure'
  | 'Per wRVU';

export interface CallTierRate {
  weekday: number;
  weekend: number;
  holiday: number;
  traumaUpliftPercent?: number; // Optional percentage uplift for trauma/high-acuity
  // Percentage-based rate calculation options
  weekendUpliftPercent?: number; // Weekend rate = weekday * (1 + weekendUpliftPercent/100)
  holidayUpliftPercent?: number; // Holiday rate = weekday * (1 + holidayUpliftPercent/100)
  usePercentageBasedRates?: boolean; // Toggle between manual entry and percentage-based
}

export interface CallTierBurden {
  weekdayCallsPerMonth: number;
  weekendCallsPerMonth: number;
  holidaysPerYear: number;
  avgCallbacksPer24h: number;
  avgCasesPer24h?: number; // For procedural specialties
}

export interface CallPayBenchmarks {
  weekday?: {
    p25?: number;
    p50?: number;
    p75?: number;
    p90?: number;
  };
  weekend?: {
    p25?: number;
    p50?: number;
    p75?: number;
    p90?: number;
  };
  holiday?: {
    p25?: number;
    p50?: number;
    p75?: number;
    p90?: number;
  };
}

export interface TierImpact {
  tierId: string;
  tierName: string;
  annualPayPerProvider: number;
  annualPayForGroup: number;
  effectiveDollarsPer24h: number;
  effectiveDollarsPerCall: number;
}

export interface CallPayImpact {
  tiers: TierImpact[];
  totalAnnualCallSpend: number;
  averageCallPayPerProvider: number;
  callPayPer1FTE: number;
  callPayAsPercentOfTCC?: number; // If TCC reference is available
}

/**
 * Compliance & Audit Types
 */
export interface FMVOverride {
  tierId: string;
  rateType: 'weekday' | 'weekend' | 'holiday';
  rate: number;
  benchmarkPercentile: number;
  benchmarkValue: number;
  justification: string;
  approvedBy?: string;
  approvedDate?: string;
  supportingDocumentation?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: 'rate_change' | 'benchmark_update' | 'scenario_save' | 'scenario_load' | 'compliance_review' | 'override_approval';
  description: string;
  previousValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

export interface ComplianceMetadata {
  lastComplianceReview?: string;
  nextComplianceReview?: string;
  reviewedBy?: string;
  fmvOverrides: FMVOverride[];
  auditLog: AuditLogEntry[];
  benchmarkDataSource?: string;
  benchmarkSurveyYear?: number;
  commercialReasonablenessStatement?: string;
}

/**
 * Risk Adjustment Types
 */
export interface RiskAdjustmentFactors {
  patientComplexityMultiplier?: number; // 0.8 - 1.5
  acuityLevelModifier?: number; // 0.9 - 1.3
  traumaCenterAdjustment?: number; // 1.0 - 1.25
  caseMixAdjustment?: number; // 0.85 - 1.15
}

export interface CallTier {
  id: string; // C1, C2, C3, C4, C5
  name: string; // Default "C1", editable
  coverageType: CoverageType;
  paymentMethod: PaymentMethod;
  rates: CallTierRate;
  burden: CallTierBurden;
  enabled: boolean; // Whether this tier is active
  riskAdjustment?: RiskAdjustmentFactors;
}

export interface CallPayContext {
  specialty: Specialty | string; // Allow custom specialties
  serviceLine: string;
  providersOnCall: number;
  rotationRatio: number; // 1-in-N format
  modelYear: number;
  complianceMetadata?: ComplianceMetadata;
}

