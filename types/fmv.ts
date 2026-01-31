/**
 * FMV (Fair Market Value) Types
 * 
 * Types for representing market benchmarks and FMV evaluation results
 */

export type FMVSource = "SC" | "MGMA" | "ECG" | "Gallagher" | "Other";

/**
 * Market benchmark data for call pay rates
 */
export interface FMVBenchmark {
  id: string;
  specialty: string;             // e.g. "Pediatric Cardiology"
  coverageType: string;          // e.g. "In-house", "Home call", "Hybrid"
  source: FMVSource;
  surveyYear: number;

  medianRatePer24h: number;      // 50th percentile
  p25RatePer24h?: number;
  p75RatePer24h?: number;
  p90RatePer24h?: number;
}

/**
 * Input for FMV evaluation
 */
export interface FMVEvaluationInput {
  specialty: string;
  coverageType: string;
  effectiveRatePer24h: number;   // from our call budget engine
  burdenScore?: number;          // from burden metrics (0–100 if available)
}

/**
 * Risk level classification for FMV compliance
 */
export type FMVRiskLevel = "LOW" | "MODERATE" | "HIGH";

/**
 * Result of FMV evaluation
 */
export interface FMVEvaluationResult {
  benchmark?: FMVBenchmark;
  percentileEstimate?: number;   // rough percentile position (0–100)
  riskLevel: FMVRiskLevel;
  notes: string[];               // bullet-style flags
  narrativeSummary: string;      // 2–5 sentence justification paragraph
}























