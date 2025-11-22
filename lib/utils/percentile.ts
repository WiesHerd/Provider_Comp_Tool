import { MarketBenchmarks } from '@/types';

/**
 * Calculate percentile using piecewise linear interpolation
 * between known benchmark points (25th, 50th, 75th, 90th)
 * Extrapolates for values below 25th and above 90th percentiles
 */
export function calculatePercentile(
  value: number,
  benchmarks: { p25?: number; p50?: number; p75?: number; p90?: number }
): number {
  const { p25, p50, p75, p90 } = benchmarks;

  // If no benchmarks, return default
  if (!p25 && !p50 && !p75 && !p90) {
    return 50;
  }

  // Extrapolate below 25th percentile
  if (p25 && value < p25) {
    if (p50) {
      // Use slope from p25 to p50 to extrapolate below p25
      // Assume p0 (0th percentile) is approximately 0.6 * p25 (conservative estimate)
      const p0 = p25 * 0.6;
      if (value <= p0) {
        // Below estimated 0th percentile, return 0
        return 0;
      }
      // Extrapolate between p0 and p25
      const ratio = (value - p0) / (p25 - p0);
      return ratio * 25; // 0 to 25 percentile
    } else if (p25) {
      // Only p25 available, use simple linear extrapolation
      // Assume p0 is 0.6 * p25
      const p0 = p25 * 0.6;
      if (value <= p0) return 0;
      const ratio = (value - p0) / (p25 - p0);
      return ratio * 25;
    }
    return 0;
  }

  // Extrapolate above 90th percentile
  if (p90 && value > p90) {
    if (p75) {
      // Use slope from p75 to p90 to extrapolate above p90
      // Assume p100 (100th percentile) is approximately 1.3 * p90 (conservative estimate)
      const p100 = p90 * 1.3;
      if (value >= p100) {
        // Above estimated 100th percentile, return 100
        return 100;
      }
      // Extrapolate between p90 and p100
      const ratio = (value - p90) / (p100 - p90);
      return 90 + ratio * 10; // 90 to 100 percentile
    } else if (p90) {
      // Only p90 available, use simple linear extrapolation
      const p100 = p90 * 1.3;
      if (value >= p100) return 100;
      const ratio = (value - p90) / (p100 - p90);
      return 90 + ratio * 10;
    }
    return 100;
  }

  // Piecewise linear interpolation within known range
  if (p25 && p50 && value >= p25 && value <= p50) {
    // Between 25th and 50th
    const ratio = (value - p25) / (p50 - p25);
    return 25 + ratio * 25; // 25 to 50 percentile
  }

  if (p50 && p75 && value >= p50 && value <= p75) {
    // Between 50th and 75th
    const ratio = (value - p50) / (p75 - p50);
    return 50 + ratio * 25; // 50 to 75 percentile
  }

  if (p75 && p90 && value >= p75 && value <= p90) {
    // Between 75th and 90th
    const ratio = (value - p75) / (p90 - p75);
    return 75 + ratio * 15; // 75 to 90 percentile
  }

  // Edge case: value equals a benchmark exactly
  if (p25 && value === p25) return 25;
  if (p50 && value === p50) return 50;
  if (p75 && value === p75) return 75;
  if (p90 && value === p90) return 90;

  // If we don't have enough benchmarks for interpolation, return a default
  return 50;
}

/**
 * Calculate TCC percentile from market benchmarks
 */
export function calculateTCCPercentile(
  normalizedTcc: number,
  benchmarks: MarketBenchmarks
): number {
  return calculatePercentile(normalizedTcc, {
    p25: benchmarks.tcc25,
    p50: benchmarks.tcc50,
    p75: benchmarks.tcc75,
    p90: benchmarks.tcc90,
  });
}

/**
 * Calculate wRVU percentile from market benchmarks
 */
export function calculateWRVUPercentile(
  normalizedWrvus: number,
  benchmarks: MarketBenchmarks
): number {
  return calculatePercentile(normalizedWrvus, {
    p25: benchmarks.wrvu25,
    p50: benchmarks.wrvu50,
    p75: benchmarks.wrvu75,
    p90: benchmarks.wrvu90,
  });
}

/**
 * Calculate CF (Conversion Factor) percentile from market benchmarks
 */
export function calculateCFPercentile(
  effectiveCF: number,
  benchmarks: MarketBenchmarks
): number {
  return calculatePercentile(effectiveCF, {
    p25: benchmarks.cf25,
    p50: benchmarks.cf50,
    p75: benchmarks.cf75,
    p90: benchmarks.cf90,
  });
}

