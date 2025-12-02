import { calculatePercentile } from '../percentile';

describe('calculatePercentile', () => {
  const benchmarks = {
    p25: 100,
    p50: 200,
    p75: 300,
    p90: 400,
  };

  it('should return 0 for values below 25th percentile', () => {
    expect(calculatePercentile(50, benchmarks)).toBe(0);
  });

  it('should return 100 for values above 90th percentile', () => {
    expect(calculatePercentile(500, benchmarks)).toBe(100);
  });

  it('should interpolate between 25th and 50th percentile', () => {
    const result = calculatePercentile(150, benchmarks);
    expect(result).toBeGreaterThan(25);
    expect(result).toBeLessThan(50);
  });

  it('should interpolate between 50th and 75th percentile', () => {
    const result = calculatePercentile(250, benchmarks);
    expect(result).toBeGreaterThan(50);
    expect(result).toBeLessThan(75);
  });

  it('should interpolate between 75th and 90th percentile', () => {
    const result = calculatePercentile(350, benchmarks);
    expect(result).toBeGreaterThan(75);
    expect(result).toBeLessThan(90);
  });
});














