import { MarketBenchmarks } from '@/types';

/**
 * Calculate percentile using piecewise linear interpolation
 * between known benchmark points (25th, 50th, 75th, 90th)
 * Extrapolates for values below 25th and above 90th percentiles
 * 
 * Interpolation method:
 * - Uses linear interpolation between adjacent percentile points
 * - Below 25th: assumes 0th percentile = 0, linear to 25th
 * - Above 90th: extrapolates assuming 100th percentile ≈ 1.3 × 90th percentile
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
    if (value <= 0) {
      // Negative or zero values return 0 percentile
      return 0;
    }
    
    // Simple linear interpolation from 0 to p25
    // Assumes 0th percentile = 0, 25th percentile = p25
    // This gives us: percentile = 25 * (value / p25)
    const ratio = value / p25;
    return Math.max(0, ratio * 25); // 0 to 25 percentile
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

/**
 * Get value at a given percentile using linear interpolation
 * Reverse operation of calculatePercentile - given a percentile, return the value
 * Uses piecewise linear interpolation between known benchmark points (25th, 50th, 75th, 90th)
 * Extrapolates for percentiles below 25th and above 90th
 * 
 * Interpolation method:
 * - Uses linear interpolation between adjacent percentile points
 * - Below 25th: linear from 0 to 25th percentile value
 * - Above 90th: extrapolates assuming 100th percentile ≈ 1.3 × 90th percentile
 */
export function getValueAtPercentile(
  percentile: number,
  benchmarks: { p25?: number; p50?: number; p75?: number; p90?: number }
): number | null {
  const { p25, p50, p75, p90 } = benchmarks;

  // If no benchmarks, return null
  if (!p25 && !p50 && !p75 && !p90) {
    return null;
  }

  // Handle edge cases
  if (percentile <= 0) {
    return 0;
  }
  if (percentile >= 100) {
    // Extrapolate above 90th - assume 100th is 1.3 * 90th
    if (p90) {
      return p90 * 1.3;
    }
    return null;
  }

  // Extrapolate below 25th percentile
  if (percentile < 25 && p25) {
    // Linear interpolation from 0 to p25
    // percentile = 25 * (value / p25)
    // value = p25 * (percentile / 25)
    return p25 * (percentile / 25);
  }

  // Extrapolate above 90th percentile
  if (percentile > 90 && p90) {
    // Assume p100 = 1.3 * p90
    const p100 = p90 * 1.3;
    // Linear interpolation between p90 and p100
    const ratio = (percentile - 90) / 10;
    return p90 + (p100 - p90) * ratio;
  }

  // Piecewise linear interpolation within known range
  if (p25 && p50 && percentile >= 25 && percentile <= 50) {
    // Between 25th and 50th
    const ratio = (percentile - 25) / 25;
    return p25 + (p50 - p25) * ratio;
  }

  if (p50 && p75 && percentile >= 50 && percentile <= 75) {
    // Between 50th and 75th
    const ratio = (percentile - 50) / 25;
    return p50 + (p75 - p50) * ratio;
  }

  if (p75 && p90 && percentile >= 75 && percentile <= 90) {
    // Between 75th and 90th
    const ratio = (percentile - 75) / 15;
    return p75 + (p90 - p75) * ratio;
  }

  // Edge case: percentile equals a benchmark exactly
  if (percentile === 25 && p25) return p25;
  if (percentile === 50 && p50) return p50;
  if (percentile === 75 && p75) return p75;
  if (percentile === 90 && p90) return p90;

  return null;
}

/**
 * Get TCC value at a given percentile from market benchmarks
 */
export function getTccValueAtPercentile(
  percentile: number,
  benchmarks: MarketBenchmarks
): number | null {
  return getValueAtPercentile(percentile, {
    p25: benchmarks.tcc25,
    p50: benchmarks.tcc50,
    p75: benchmarks.tcc75,
    p90: benchmarks.tcc90,
  });
}

/**
 * Get wRVU value at a given percentile from market benchmarks
 */
export function getWrvuValueAtPercentile(
  percentile: number,
  benchmarks: MarketBenchmarks
): number | null {
  return getValueAtPercentile(percentile, {
    p25: benchmarks.wrvu25,
    p50: benchmarks.wrvu50,
    p75: benchmarks.wrvu75,
    p90: benchmarks.wrvu90,
  });
}

/**
 * Get percentile for a value - wrapper function for consistency
 * Maps value → percentile using the appropriate metric type
 */
export function getPercentileForValue(
  value: number,
  metric: 'wrvu' | 'tcc' | 'cf',
  benchmarks: MarketBenchmarks
): number {
  switch (metric) {
    case 'wrvu':
      return calculateWRVUPercentile(value, benchmarks);
    case 'tcc':
      return calculateTCCPercentile(value, benchmarks);
    case 'cf':
      return calculateCFPercentile(value, benchmarks);
    default:
      return 50;
  }
}

