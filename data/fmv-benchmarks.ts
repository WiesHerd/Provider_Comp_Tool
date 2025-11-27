/**
 * FMV Benchmark Data
 * 
 * Sample market benchmark data for call pay rates.
 * This is demo data - in production, this would be loaded from external survey sources.
 */

import { FMVBenchmark } from '@/types/fmv';

/**
 * Sample FMV benchmarks for various specialties and coverage types
 * 
 * Note: These are example values for demonstration purposes.
 * Real benchmarks would come from SullivanCotter, MGMA, ECG, or Gallagher surveys.
 */
export const SAMPLE_FMV_BENCHMARKS: FMVBenchmark[] = [
  // Pediatrics - In-house
  {
    id: 'ped-inhouse-2024',
    specialty: 'Pediatrics',
    coverageType: 'In-house',
    source: 'MGMA',
    surveyYear: 2024,
    medianRatePer24h: 1200,
    p25RatePer24h: 950,
    p75RatePer24h: 1500,
    p90RatePer24h: 1800,
  },
  
  // Cardiology - In-house
  {
    id: 'cardio-inhouse-2024',
    specialty: 'Cardiology',
    coverageType: 'In-house',
    source: 'SC',
    surveyYear: 2024,
    medianRatePer24h: 1800,
    p25RatePer24h: 1400,
    p75RatePer24h: 2200,
    p90RatePer24h: 2800,
  },
  
  // Hospital Medicine - In-house
  {
    id: 'hospitalist-inhouse-2024',
    specialty: 'Hospitalist',
    coverageType: 'In-house',
    source: 'MGMA',
    surveyYear: 2024,
    medianRatePer24h: 1000,
    p25RatePer24h: 800,
    p75RatePer24h: 1250,
    p90RatePer24h: 1600,
  },
  
  // General Surgery - In-house
  {
    id: 'surgery-inhouse-2024',
    specialty: 'General Surgery',
    coverageType: 'In-house',
    source: 'ECG',
    surveyYear: 2024,
    medianRatePer24h: 2000,
    p25RatePer24h: 1600,
    p75RatePer24h: 2500,
    p90RatePer24h: 3200,
  },
  
  // Pediatrics - Home call
  {
    id: 'ped-homecall-2024',
    specialty: 'Pediatrics',
    coverageType: 'Unrestricted home',
    source: 'MGMA',
    surveyYear: 2024,
    medianRatePer24h: 800,
    p25RatePer24h: 600,
    p75RatePer24h: 1000,
    p90RatePer24h: 1300,
  },
  
  // Generic fallback - In-house
  {
    id: 'generic-inhouse-2024',
    specialty: 'All Specialties',
    coverageType: 'In-house',
    source: 'MGMA',
    surveyYear: 2024,
    medianRatePer24h: 1400,
    p25RatePer24h: 1100,
    p75RatePer24h: 1800,
    p90RatePer24h: 2300,
  },
];


