/**
 * FMV Evaluator
 * 
 * Pure functions for evaluating Fair Market Value compliance
 * based on market benchmarks and call pay metrics.
 */

import { FMVBenchmark, FMVEvaluationInput, FMVEvaluationResult, FMVRiskLevel } from '@/types/fmv';
import { SAMPLE_FMV_BENCHMARKS } from '@/data/fmv-benchmarks';

/**
 * Find the best matching benchmark for a given specialty and coverage type
 * 
 * Matching priority:
 * 1. Exact match on specialty + coverageType
 * 2. Specialty match only (any coverageType)
 * 3. Generic "All Specialties" fallback
 */
export function findBestMatchingBenchmark(
  specialty: string,
  coverageType: string
): FMVBenchmark | undefined {
  // Try exact match first
  const exactMatch = SAMPLE_FMV_BENCHMARKS.find(
    b => b.specialty === specialty && b.coverageType === coverageType
  );
  if (exactMatch) return exactMatch;

  // Try specialty-only match
  const specialtyMatch = SAMPLE_FMV_BENCHMARKS.find(
    b => b.specialty === specialty
  );
  if (specialtyMatch) return specialtyMatch;

  // Fallback to generic "All Specialties"
  const genericMatch = SAMPLE_FMV_BENCHMARKS.find(
    b => b.specialty === 'All Specialties' && b.coverageType === coverageType
  );
  if (genericMatch) return genericMatch;

  // Final fallback: generic "All Specialties" with any coverage type
  return SAMPLE_FMV_BENCHMARKS.find(
    b => b.specialty === 'All Specialties'
  );
}

/**
 * Estimate percentile position based on benchmark data
 */
function estimatePercentile(
  rate: number,
  benchmark: FMVBenchmark
): number {
  const { medianRatePer24h, p25RatePer24h, p75RatePer24h, p90RatePer24h } = benchmark;

  // Below 25th percentile
  if (p25RatePer24h && rate < p25RatePer24h) {
    return 15; // Rough estimate: below 25th
  }

  // Between 25th and median
  if (p25RatePer24h && rate >= p25RatePer24h && rate < medianRatePer24h) {
    return 37; // Rough estimate: ~37th percentile
  }

  // At or near median
  if (rate >= medianRatePer24h && (!p75RatePer24h || rate < p75RatePer24h)) {
    // Check if closer to median or p75
    if (p75RatePer24h) {
      const distanceToMedian = Math.abs(rate - medianRatePer24h);
      const distanceToP75 = Math.abs(rate - p75RatePer24h);
      return distanceToMedian < distanceToP75 ? 50 : 62;
    }
    return 50;
  }

  // Between 75th and 90th
  if (p75RatePer24h && rate >= p75RatePer24h && (!p90RatePer24h || rate < p90RatePer24h)) {
    if (p90RatePer24h) {
      const distanceToP75 = Math.abs(rate - p75RatePer24h);
      const distanceToP90 = Math.abs(rate - p90RatePer24h);
      return distanceToP75 < distanceToP90 ? 82 : 87;
    }
    return 82;
  }

  // Above 90th percentile
  if (p90RatePer24h && rate >= p90RatePer24h) {
    // Estimate how far above
    const excess = rate - p90RatePer24h;
    const range = p90RatePer24h - (p75RatePer24h || medianRatePer24h);
    if (range > 0) {
      const multiplier = excess / range;
      return Math.min(95 + Math.floor(multiplier * 5), 99);
    }
    return 95;
  }

  // Default fallback
  return 50;
}

/**
 * Determine risk level based on percentile and burden score
 */
function determineRiskLevel(
  percentile: number,
  burdenScore?: number
): FMVRiskLevel {
  // Adjust risk based on burden score
  if (burdenScore !== undefined) {
    // High burden can justify higher rates
    if (burdenScore >= 80 && percentile >= 75 && percentile < 90) {
      return 'MODERATE'; // Downgrade from potential HIGH
    }
    
    // Low burden with high rate is riskier
    if (burdenScore < 60 && percentile >= 90) {
      return 'HIGH'; // High rate without high burden
    }
    
    // High burden with very high rate might still be MODERATE
    if (burdenScore >= 80 && percentile >= 90) {
      return 'MODERATE'; // High rate but justified by burden
    }
  }

  // Base risk classification
  if (percentile < 25) {
    return 'MODERATE'; // Underpay risk
  }
  
  if (percentile >= 25 && percentile <= 75) {
    return 'LOW';
  }
  
  if (percentile > 75 && percentile <= 90) {
    return 'MODERATE';
  }
  
  // Above 90th percentile
  return 'HIGH';
}

/**
 * Generate notes/flags for the FMV evaluation
 */
function generateNotes(
  percentile: number,
  benchmark: FMVBenchmark,
  effectiveRatePer24h: number,
  burdenScore?: number
): string[] {
  const notes: string[] = [];
  const { p75RatePer24h, p90RatePer24h } = benchmark;

  // Percentile-based notes
  if (percentile < 25) {
    notes.push('Below 25th percentile of market rates');
    // Note: We don't have the actual rate here, so we skip the percentage calculation
  } else if (percentile >= 25 && percentile < 50) {
    notes.push('Below median market rate');
  } else if (percentile >= 50 && percentile <= 75) {
    notes.push('Within typical market range (25th-75th percentile)');
  } else if (percentile > 75 && percentile <= 90) {
    notes.push('Above 75th percentile of market rates');
    if (p90RatePer24h) {
      notes.push('Approaching 90th percentile');
    }
  } else {
    notes.push('Above 90th percentile of market rates');
    if (p90RatePer24h && p75RatePer24h) {
      const excess = effectiveRatePer24h - p90RatePer24h;
      const range = p90RatePer24h - p75RatePer24h;
      if (excess > 0 && range > 0) {
        const multiplier = excess / range;
        if (multiplier > 0.5) {
          notes.push(`Significantly above market benchmarks`);
        }
      }
    }
  }

  // Burden context notes
  if (burdenScore !== undefined) {
    if (burdenScore >= 80 && percentile >= 75) {
      notes.push('High call burden supports above-median rate');
    } else if (burdenScore < 60 && percentile >= 90) {
      notes.push('High rate with relatively low call burden');
    } else if (burdenScore >= 80) {
      notes.push('High call burden context considered');
    }
  }

  return notes;
}

/**
 * Build narrative summary for FMV evaluation
 */
export function buildFMVNarrative(
  result: FMVEvaluationResult,
  input: FMVEvaluationInput
): string {
  const { benchmark, percentileEstimate, riskLevel } = result;
  const { effectiveRatePer24h, burdenScore } = input;

  if (!benchmark) {
    return `No direct market benchmark data is available for ${input.specialty} with ${input.coverageType} coverage type. ` +
           `FMV determination requires professional judgment and may benefit from a formal valuation. ` +
           `The effective rate of $${effectiveRatePer24h.toLocaleString()} per 24-hour period should be evaluated against ` +
           `comparable arrangements and documented with appropriate justification.`;
  }

  const sourceName = benchmark.source === 'SC' ? 'SullivanCotter' :
                     benchmark.source === 'MGMA' ? 'MGMA' :
                     benchmark.source === 'ECG' ? 'ECG' :
                     benchmark.source === 'Gallagher' ? 'Gallagher' :
                     benchmark.source;

  let narrative = `Based on ${sourceName} ${benchmark.surveyYear} survey data for ${benchmark.specialty} with ${benchmark.coverageType} coverage, `;

  if (percentileEstimate !== undefined) {
    if (percentileEstimate < 25) {
      narrative += `the effective rate of $${effectiveRatePer24h.toLocaleString()} per 24-hour period falls below the 25th percentile (approximately ${percentileEstimate}th percentile). `;
    } else if (percentileEstimate >= 25 && percentileEstimate < 50) {
      narrative += `the effective rate of $${effectiveRatePer24h.toLocaleString()} per 24-hour period falls below the median, approximately at the ${percentileEstimate}th percentile. `;
    } else if (percentileEstimate >= 50 && percentileEstimate <= 75) {
      narrative += `the effective rate of $${effectiveRatePer24h.toLocaleString()} per 24-hour period falls within the typical market range, approximately at the ${percentileEstimate}th percentile. `;
    } else if (percentileEstimate > 75 && percentileEstimate <= 90) {
      narrative += `the effective rate of $${effectiveRatePer24h.toLocaleString()} per 24-hour period falls above the 75th percentile, approximately at the ${percentileEstimate}th percentile. `;
    } else {
      narrative += `the effective rate of $${effectiveRatePer24h.toLocaleString()} per 24-hour period falls above the 90th percentile (approximately ${percentileEstimate}th percentile). `;
    }
  } else {
    narrative += `the effective rate of $${effectiveRatePer24h.toLocaleString()} per 24-hour period `;
  }

  // Add burden context
  if (burdenScore !== undefined) {
    if (burdenScore >= 80) {
      narrative += `The arrangement includes high call burden (burden score: ${burdenScore}), which supports the compensation level. `;
    } else if (burdenScore < 60) {
      narrative += `The arrangement includes relatively low call burden (burden score: ${burdenScore}). `;
    }
  }

  // Add risk language
  if (riskLevel === 'LOW') {
    narrative += `This rate appears reasonable and consistent with market FMV ranges. `;
  } else if (riskLevel === 'MODERATE') {
    narrative += `This rate may warrant additional review or documentation to support FMV compliance. `;
  } else {
    narrative += `This rate may be considered above typical FMV and requires formal valuation and comprehensive documentation to support compliance. `;
  }

  narrative += `The median market rate for this specialty and coverage type is $${benchmark.medianRatePer24h.toLocaleString()} per 24-hour period.`;

  return narrative;
}

/**
 * Evaluate FMV compliance for a given call pay arrangement
 */
export function evaluateFMV(input: FMVEvaluationInput): FMVEvaluationResult {
  const { specialty, coverageType, effectiveRatePer24h, burdenScore } = input;

  // Find matching benchmark
  const benchmark = findBestMatchingBenchmark(specialty, coverageType);

  if (!benchmark) {
    // No benchmark found
    const notes: string[] = [
      'No direct benchmark data available for this specialty/coverage type combination',
      'Professional judgment required',
    ];

    const narrative = buildFMVNarrative(
      {
        riskLevel: 'MODERATE',
        notes,
        narrativeSummary: '', // Will be set below
      },
      input
    );

    return {
      riskLevel: 'MODERATE',
      notes,
      narrativeSummary: narrative,
    };
  }

  // Calculate percentile estimate
  const percentileEstimate = estimatePercentile(effectiveRatePer24h, benchmark);

  // Determine risk level
  const riskLevel = determineRiskLevel(percentileEstimate, burdenScore);

  // Generate notes
  const notes = generateNotes(percentileEstimate, benchmark, effectiveRatePer24h, burdenScore);

  // Build narrative
  const result: FMVEvaluationResult = {
    benchmark,
    percentileEstimate,
    riskLevel,
    notes,
    narrativeSummary: '', // Will be set below
  };

  result.narrativeSummary = buildFMVNarrative(result, input);

  return result;
}

