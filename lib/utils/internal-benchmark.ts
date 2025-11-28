/**
 * Internal Benchmark Utilities
 * 
 * Functions for calculating internal percentiles, blending benchmarks, and CF recommendations
 * All calculations reuse existing Phase 1-4 logic
 */

import {
  ProviderRecord,
  InternalPercentiles,
  BlendedBenchmarks,
  BlendingMode,
  BlendingWeights,
  CFRecommendation,
  ComparisonMetrics,
} from '@/types/internal-benchmark';
import { MarketBenchmarks } from '@/types';
import { normalizeWrvus, normalizeTcc, calculateEffectiveCF } from './normalization';

/**
 * Calculate percentiles from a sorted array of numbers
 */
function calculatePercentilesFromArray(data: number[]): {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
} {
  if (data.length === 0) {
    return { p25: 0, p50: 0, p75: 0, p90: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const len = sorted.length;

  // Use linear interpolation for more accurate percentiles
  const getPercentile = (percentile: number): number => {
    const index = (percentile / 100) * (len - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  return {
    p25: getPercentile(25),
    p50: getPercentile(50),
    p75: getPercentile(75),
    p90: getPercentile(90),
  };
}

/**
 * Normalize provider data by FTE
 */
export function normalizeProviderData(records: ProviderRecord[]): {
  normalizedWrvus: number[];
  normalizedTcc: number[];
} {
  const normalizedWrvus: number[] = [];
  const normalizedTcc: number[] = [];

  records.forEach((record) => {
    if (record.fte > 0) {
      normalizedWrvus.push(normalizeWrvus(record.wrvus, record.fte));
      normalizedTcc.push(normalizeTcc(record.tcc, record.fte));
    }
  });

  return { normalizedWrvus, normalizedTcc };
}

/**
 * Calculate internal percentiles from provider records
 */
export function calculateInternalPercentiles(
  records: ProviderRecord[]
): InternalPercentiles | null {
  if (records.length === 0) {
    return null;
  }

  const { normalizedWrvus, normalizedTcc } = normalizeProviderData(records);

  if (normalizedWrvus.length === 0 || normalizedTcc.length === 0) {
    return null;
  }

  const wrvuPercentiles = calculatePercentilesFromArray(normalizedWrvus);
  const tccPercentiles = calculatePercentilesFromArray(normalizedTcc);

  return {
    wrvu25: wrvuPercentiles.p25,
    wrvu50: wrvuPercentiles.p50,
    wrvu75: wrvuPercentiles.p75,
    wrvu90: wrvuPercentiles.p90,
    tcc25: tccPercentiles.p25,
    tcc50: tccPercentiles.p50,
    tcc75: tccPercentiles.p75,
    tcc90: tccPercentiles.p90,
  };
}

/**
 * Blend internal and survey benchmarks
 */
export function blendBenchmarks(
  internalPercentiles: InternalPercentiles,
  surveyBenchmarks: MarketBenchmarks,
  mode: BlendingMode,
  weights?: BlendingWeights
): BlendedBenchmarks {
  if (mode === 'survey-only') {
    return {
      mode: 'survey-only',
      wrvu25: surveyBenchmarks.wrvu25 || 0,
      wrvu50: surveyBenchmarks.wrvu50 || 0,
      wrvu75: surveyBenchmarks.wrvu75 || 0,
      wrvu90: surveyBenchmarks.wrvu90 || 0,
      tcc25: surveyBenchmarks.tcc25 || 0,
      tcc50: surveyBenchmarks.tcc50 || 0,
      tcc75: surveyBenchmarks.tcc75 || 0,
      tcc90: surveyBenchmarks.tcc90 || 0,
    };
  }

  if (mode === 'internal-only') {
    return {
      mode: 'internal-only',
      wrvu25: internalPercentiles.wrvu25,
      wrvu50: internalPercentiles.wrvu50,
      wrvu75: internalPercentiles.wrvu75,
      wrvu90: internalPercentiles.wrvu90,
      tcc25: internalPercentiles.tcc25,
      tcc50: internalPercentiles.tcc50,
      tcc75: internalPercentiles.tcc75,
      tcc90: internalPercentiles.tcc90,
    };
  }

  // Blended mode
  const internalWeight = weights?.internalWeight || 0.5;
  const surveyWeight = weights?.surveyWeight || 0.5;

  return {
    mode: 'blended',
    weights: { internalWeight, surveyWeight },
    wrvu25:
      (internalPercentiles.wrvu25 * internalWeight) +
      ((surveyBenchmarks.wrvu25 || 0) * surveyWeight),
    wrvu50:
      (internalPercentiles.wrvu50 * internalWeight) +
      ((surveyBenchmarks.wrvu50 || 0) * surveyWeight),
    wrvu75:
      (internalPercentiles.wrvu75 * internalWeight) +
      ((surveyBenchmarks.wrvu75 || 0) * surveyWeight),
    wrvu90:
      (internalPercentiles.wrvu90 * internalWeight) +
      ((surveyBenchmarks.wrvu90 || 0) * surveyWeight),
    tcc25:
      (internalPercentiles.tcc25 * internalWeight) +
      ((surveyBenchmarks.tcc25 || 0) * surveyWeight),
    tcc50:
      (internalPercentiles.tcc50 * internalWeight) +
      ((surveyBenchmarks.tcc50 || 0) * surveyWeight),
    tcc75:
      (internalPercentiles.tcc75 * internalWeight) +
      ((surveyBenchmarks.tcc75 || 0) * surveyWeight),
    tcc90:
      (internalPercentiles.tcc90 * internalWeight) +
      ((surveyBenchmarks.tcc90 || 0) * surveyWeight),
  };
}

/**
 * Calculate CF recommendation from blended benchmarks
 */
export function calculateCFRecommendation(
  blendedBenchmarks: BlendedBenchmarks,
  modelYear: number
): CFRecommendation {
  // Calculate effective CF for each percentile
  const cf25 = calculateEffectiveCF(blendedBenchmarks.tcc25, blendedBenchmarks.wrvu25);
  const cf50 = calculateEffectiveCF(blendedBenchmarks.tcc50, blendedBenchmarks.wrvu50);
  const cf75 = calculateEffectiveCF(blendedBenchmarks.tcc75, blendedBenchmarks.wrvu75);
  const cf90 = calculateEffectiveCF(blendedBenchmarks.tcc90, blendedBenchmarks.wrvu90);

  // Use median as base, 25th-75th as range
  const recommendedMin = Math.min(cf25, cf50 * 0.9);
  const recommendedMax = Math.max(cf75, cf50 * 1.1);

  return {
    minCF: recommendedMin,
    maxCF: recommendedMax,
    medianCF: cf50,
    justification: `Based on blended ${blendedBenchmarks.mode === 'blended' ? `(${((blendedBenchmarks.weights?.internalWeight || 0) * 100).toFixed(0)}% internal / ${((blendedBenchmarks.weights?.surveyWeight || 0) * 100).toFixed(0)}% survey)` : blendedBenchmarks.mode} benchmarks`,
    commentary: '',
    modelYear,
  };
}

/**
 * Generate executive justification text
 */
export function generateJustificationText(
  internalPercentiles: InternalPercentiles,
  surveyBenchmarks: MarketBenchmarks,
  blendedBenchmarks: BlendedBenchmarks,
  recommendation: CFRecommendation
): string {
  // Calculate how internal median compares to survey median
  const tccMedianDifference = internalPercentiles.tcc50 - (surveyBenchmarks.tcc50 || 0);
  const tccMedianPercentDiff =
    surveyBenchmarks.tcc50 && surveyBenchmarks.tcc50 > 0
      ? (tccMedianDifference / surveyBenchmarks.tcc50) * 100
      : 0;

  const wrvuMedianDifference = internalPercentiles.wrvu50 - (surveyBenchmarks.wrvu50 || 0);
  const wrvuMedianPercentDiff =
    surveyBenchmarks.wrvu50 && surveyBenchmarks.wrvu50 > 0
      ? (wrvuMedianDifference / surveyBenchmarks.wrvu50) * 100
      : 0;

  // Determine TCC percentile of internal median
  const internalTccPercentile = calculateTccPercentileOfValue(
    internalPercentiles.tcc50,
    surveyBenchmarks
  );

  const lines: string[] = [];
  lines.push(`For FY${recommendation.modelYear} – Suggested CF Range: $${recommendation.minCF.toFixed(2)}–$${recommendation.maxCF.toFixed(2)}`);
  lines.push('');
  lines.push(
    `Median internal provider TCC is at the ${Math.round(internalTccPercentile)}th percentile of survey data.`
  );
  
  if (wrvuMedianPercentDiff > 0) {
    lines.push(
      `Internal productivity levels are ${Math.abs(wrvuMedianPercentDiff).toFixed(0)}% above survey median,`
    );
  } else if (wrvuMedianPercentDiff < 0) {
    lines.push(
      `Internal productivity levels are ${Math.abs(wrvuMedianPercentDiff).toFixed(0)}% below survey median,`
    );
  } else {
    lines.push('Internal productivity levels align with survey median,');
  }

  if (tccMedianPercentDiff > 5) {
    lines.push('suggesting current CF may be above market. Consider reviewing compensation structure.');
  } else if (tccMedianPercentDiff < -5) {
    lines.push('suggesting current CF may be below market. Consider adjustment to remain competitive.');
  } else {
    lines.push('suggesting current CF is likely sufficient. Recommend no increase unless recruitment pressure emerges.');
  }

  return lines.join(' ');
}

/**
 * Calculate what percentile a value falls at in survey benchmarks
 */
function calculateTccPercentileOfValue(value: number, benchmarks: MarketBenchmarks): number {
  const { tcc25, tcc50, tcc75, tcc90 } = benchmarks;

  if (!tcc25 && !tcc50 && !tcc75 && !tcc90) {
    return 50;
  }

  // Use reverse percentile calculation
  if (tcc25 && value < tcc25) {
    const ratio = value / tcc25;
    return Math.max(0, ratio * 25);
  }

  if (tcc90 && value > tcc90) {
    const p100 = tcc90 * 1.3;
    if (value >= p100) return 100;
    const ratio = (value - tcc90) / (p100 - tcc90);
    return 90 + ratio * 10;
  }

  if (tcc25 && tcc50 && value >= tcc25 && value <= tcc50) {
    const ratio = (value - tcc25) / (tcc50 - tcc25);
    return 25 + ratio * 25;
  }

  if (tcc50 && tcc75 && value >= tcc50 && value <= tcc75) {
    const ratio = (value - tcc50) / (tcc75 - tcc50);
    return 50 + ratio * 25;
  }

  if (tcc75 && tcc90 && value >= tcc75 && value <= tcc90) {
    const ratio = (value - tcc75) / (tcc90 - tcc75);
    return 75 + ratio * 15;
  }

  return 50;
}

/**
 * Calculate comparison metrics between internal and survey benchmarks
 */
export function calculateComparisonMetrics(
  internalPercentiles: InternalPercentiles,
  surveyBenchmarks: MarketBenchmarks
): ComparisonMetrics {
  const calculateDifference = (
    internal: number,
    survey: number | undefined
  ): { absolute: number; percent: number } => {
    if (!survey || survey === 0) {
      return { absolute: 0, percent: 0 };
    }
    return {
      absolute: internal - survey,
      percent: ((internal - survey) / survey) * 100,
    };
  };

  const wrvu25Diff = calculateDifference(internalPercentiles.wrvu25, surveyBenchmarks.wrvu25);
  const wrvu50Diff = calculateDifference(internalPercentiles.wrvu50, surveyBenchmarks.wrvu50);
  const wrvu75Diff = calculateDifference(internalPercentiles.wrvu75, surveyBenchmarks.wrvu75);
  const wrvu90Diff = calculateDifference(internalPercentiles.wrvu90, surveyBenchmarks.wrvu90);

  const tcc25Diff = calculateDifference(internalPercentiles.tcc25, surveyBenchmarks.tcc25);
  const tcc50Diff = calculateDifference(internalPercentiles.tcc50, surveyBenchmarks.tcc50);
  const tcc75Diff = calculateDifference(internalPercentiles.tcc75, surveyBenchmarks.tcc75);
  const tcc90Diff = calculateDifference(internalPercentiles.tcc90, surveyBenchmarks.tcc90);

  return {
    wrvuDifference: {
      p25: wrvu25Diff.absolute,
      p50: wrvu50Diff.absolute,
      p75: wrvu75Diff.absolute,
      p90: wrvu90Diff.absolute,
    },
    tccDifference: {
      p25: tcc25Diff.absolute,
      p50: tcc50Diff.absolute,
      p75: tcc75Diff.absolute,
      p90: tcc90Diff.absolute,
    },
    wrvuPercentDifference: {
      p25: wrvu25Diff.percent,
      p50: wrvu50Diff.percent,
      p75: wrvu75Diff.percent,
      p90: wrvu90Diff.percent,
    },
    tccPercentDifference: {
      p25: tcc25Diff.percent,
      p50: tcc50Diff.percent,
      p75: tcc75Diff.percent,
      p90: tcc90Diff.percent,
    },
  };
}


