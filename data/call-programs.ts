/**
 * Call Programs Catalog
 * 
 * Initial catalog of call programs
 */

import { CallProgram } from '@/types/call-program';

export const DEFAULT_CALL_PROGRAMS: CallProgram[] = [
  {
    id: 'ped-cardio-2024',
    name: 'Pediatric Cardiology Call',
    specialty: 'Pediatrics',
    serviceLine: 'Cardiology',
    site: 'Main Campus',
    modelYear: 2024,
    coverageType: 'In-house',
    shiftTypeIds: ['wnih-5p-7a', 'weih-24h', 'holiday-ih-24h'],
    defaultAssumptions: {
      weekdayCallsPerMonth: 8,
      weekendCallsPerMonth: 4,
      holidaysPerYear: 12,
    },
  },
  {
    id: 'hospitalist-2024',
    name: 'Hospitalist Call',
    specialty: 'Hospitalist',
    site: 'Main Campus',
    modelYear: 2024,
    coverageType: 'In-house',
    shiftTypeIds: ['wnih-5p-7a', 'weih-24h', 'holiday-ih-24h'],
    defaultAssumptions: {
      weekdayCallsPerMonth: 10,
      weekendCallsPerMonth: 6,
      holidaysPerYear: 10,
    },
  },
  {
    id: 'gen-surgery-2024',
    name: 'General Surgery Call',
    specialty: 'General Surgery',
    site: 'Main Campus',
    modelYear: 2024,
    coverageType: 'In-house',
    shiftTypeIds: ['wnih-5p-7a', 'weih-24h', 'holiday-ih-24h', 'backup-jeopardy'],
    defaultAssumptions: {
      weekdayCallsPerMonth: 12,
      weekendCallsPerMonth: 8,
      holidaysPerYear: 12,
    },
  },
];










