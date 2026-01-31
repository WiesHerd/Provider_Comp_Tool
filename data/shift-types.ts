/**
 * Shift Types Library
 * 
 * Initial catalog of shift types that can be used across call programs
 */

import { ShiftType } from '@/types/call-program';

export const DEFAULT_SHIFT_TYPES: ShiftType[] = [
  {
    id: 'wnih-5p-7a',
    name: 'Weeknight In-house 5p–7a',
    code: 'WNIH',
    coverageType: 'In-house',
    startTime: '17:00',
    endTime: '07:00',
    isWeekendEligible: false,
    isHolidayEligible: true,
    countsTowardBurden: true,
    isBackupShift: false,
  },
  {
    id: 'weih-24h',
    name: 'Weekend In-house 24h',
    code: 'WEIH',
    coverageType: 'In-house',
    startTime: '00:00',
    endTime: '24h',
    isWeekendEligible: true,
    isHolidayEligible: true,
    countsTowardBurden: true,
    isBackupShift: false,
  },
  {
    id: 'wnhc-unrestricted',
    name: 'Weeknight Home Call (Unrestricted)',
    code: 'WNHC',
    coverageType: 'Home call',
    startTime: '17:00',
    endTime: '07:00',
    isWeekendEligible: false,
    isHolidayEligible: true,
    countsTowardBurden: true,
    isBackupShift: false,
  },
  {
    id: 'wehc-unrestricted',
    name: 'Weekend Home Call (Unrestricted)',
    code: 'WEHC',
    coverageType: 'Home call',
    startTime: '00:00',
    endTime: '24h',
    isWeekendEligible: true,
    isHolidayEligible: true,
    countsTowardBurden: true,
    isBackupShift: false,
  },
  {
    id: 'holiday-ih-24h',
    name: 'Holiday In-house 24h',
    code: 'HOLIH',
    coverageType: 'In-house',
    startTime: '00:00',
    endTime: '24h',
    isWeekendEligible: false,
    isHolidayEligible: true,
    countsTowardBurden: true,
    isBackupShift: false,
  },
  {
    id: 'backup-jeopardy',
    name: 'Backup/Jeopardy Call',
    code: 'BACKUP',
    coverageType: 'In-house',
    startTime: '00:00',
    endTime: '24h',
    isWeekendEligible: true,
    isHolidayEligible: true,
    countsTowardBurden: false,
    isBackupShift: true,
  },
];























