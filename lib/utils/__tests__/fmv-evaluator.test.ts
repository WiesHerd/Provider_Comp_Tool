/**
 * Unit Tests for FMV Evaluator
 */

import {
  findBestMatchingBenchmark,
  evaluateFMV,
  buildFMVNarrative,
} from '@/lib/utils/fmv-evaluator';
import { FMVEvaluationInput, FMVEvaluationResult } from '@/types/fmv';

describe('findBestMatchingBenchmark', () => {
  it('should find exact match for specialty and coverage type', () => {
    const benchmark = findBestMatchingBenchmark('Pediatrics', 'In-house');
    expect(benchmark).toBeDefined();
    expect(benchmark?.specialty).toBe('Pediatrics');
    expect(benchmark?.coverageType).toBe('In-house');
  });

  it('should find specialty match when coverage type differs', () => {
    const benchmark = findBestMatchingBenchmark('Pediatrics', 'Restricted home');
    expect(benchmark).toBeDefined();
    expect(benchmark?.specialty).toBe('Pediatrics');
  });

  it('should fallback to generic "All Specialties" when no match', () => {
    const benchmark = findBestMatchingBenchmark('Unknown Specialty', 'In-house');
    expect(benchmark).toBeDefined();
    expect(benchmark?.specialty).toBe('All Specialties');
  });
});

describe('evaluateFMV', () => {
  it('should return LOW risk for rate near median', () => {
    const input: FMVEvaluationInput = {
      specialty: 'Pediatrics',
      coverageType: 'In-house',
      effectiveRatePer24h: 1200, // Near median for Pediatrics In-house
    };

    const result = evaluateFMV(input);
    expect(result.riskLevel).toBe('LOW');
    expect(result.benchmark).toBeDefined();
    expect(result.percentileEstimate).toBeDefined();
  });

  it('should return HIGH risk for rate far above p90', () => {
    const input: FMVEvaluationInput = {
      specialty: 'Pediatrics',
      coverageType: 'In-house',
      effectiveRatePer24h: 2500, // Well above p90 (1800)
    };

    const result = evaluateFMV(input);
    expect(result.riskLevel).toBe('HIGH');
    expect(result.percentileEstimate).toBeGreaterThan(90);
  });

  it('should adjust risk when burden score is high', () => {
    const input: FMVEvaluationInput = {
      specialty: 'Pediatrics',
      coverageType: 'In-house',
      effectiveRatePer24h: 2000, // Above p90
      burdenScore: 85, // High burden
    };

    const result = evaluateFMV(input);
    // High burden should downgrade risk from HIGH to MODERATE
    expect(result.riskLevel).toBe('MODERATE');
    expect(result.notes).toContain(expect.stringContaining('burden'));
  });

  it('should handle missing benchmark gracefully', () => {
    const input: FMVEvaluationInput = {
      specialty: 'Unknown Specialty',
      coverageType: 'Unknown Coverage',
      effectiveRatePer24h: 1500,
    };

    const result = evaluateFMV(input);
    expect(result.riskLevel).toBe('MODERATE');
    expect(result.benchmark).toBeUndefined();
    expect(result.narrativeSummary).toContain('No direct market benchmark');
  });

  it('should include burden context in notes when provided', () => {
    const input: FMVEvaluationInput = {
      specialty: 'Pediatrics',
      coverageType: 'In-house',
      effectiveRatePer24h: 1500,
      burdenScore: 80,
    };

    const result = evaluateFMV(input);
    expect(result.notes.some(note => note.toLowerCase().includes('burden'))).toBe(true);
  });
});

describe('buildFMVNarrative', () => {
  it('should generate narrative with benchmark information', () => {
    const result: FMVEvaluationResult = {
      benchmark: {
        id: 'test',
        specialty: 'Pediatrics',
        coverageType: 'In-house',
        source: 'MGMA',
        surveyYear: 2024,
        medianRatePer24h: 1200,
        p25RatePer24h: 950,
        p75RatePer24h: 1500,
        p90RatePer24h: 1800,
      },
      percentileEstimate: 65,
      riskLevel: 'LOW',
      notes: ['Within typical market range'],
      narrativeSummary: '',
    };

    const input: FMVEvaluationInput = {
      specialty: 'Pediatrics',
      coverageType: 'In-house',
      effectiveRatePer24h: 1300,
    };

    const narrative = buildFMVNarrative(result, input);
    expect(narrative).toBeTruthy();
    expect(narrative.length).toBeGreaterThan(50);
    expect(narrative).toContain('MGMA');
    expect(narrative).toContain('2024');
    expect(narrative).toContain('65th percentile');
    expect(narrative).toContain('reasonable');
  });

  it('should generate narrative without benchmark', () => {
    const result: FMVEvaluationResult = {
      riskLevel: 'MODERATE',
      notes: ['No benchmark available'],
      narrativeSummary: '',
    };

    const input: FMVEvaluationInput = {
      specialty: 'Unknown',
      coverageType: 'Unknown',
      effectiveRatePer24h: 1500,
    };

    const narrative = buildFMVNarrative(result, input);
    expect(narrative).toBeTruthy();
    expect(narrative).toContain('No direct market benchmark');
    expect(narrative).toContain('professional judgment');
  });

  it('should include burden context in narrative when provided', () => {
    const result: FMVEvaluationResult = {
      benchmark: {
        id: 'test',
        specialty: 'Pediatrics',
        coverageType: 'In-house',
        source: 'MGMA',
        surveyYear: 2024,
        medianRatePer24h: 1200,
      },
      percentileEstimate: 75,
      riskLevel: 'MODERATE',
      notes: [],
      narrativeSummary: '',
    };

    const input: FMVEvaluationInput = {
      specialty: 'Pediatrics',
      coverageType: 'In-house',
      effectiveRatePer24h: 1500,
      burdenScore: 85,
    };

    const narrative = buildFMVNarrative(result, input);
    expect(narrative).toContain('burden');
    expect(narrative).toContain('85');
  });
});





