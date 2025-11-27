/**
 * Call Program Catalog Types
 * 
 * Types for managing call programs and shift types as a catalog/platform
 */

import { CallAssumptions } from './call-pay-engine';

export type CoverageType = "In-house" | "Home call" | "Hybrid" | "Tele-call" | string;

/**
 * Shift Type - defines a specific call shift pattern
 */
export interface ShiftType {
  id: string;
  name: string;               // e.g. "Weeknight In-house 5p–7a"
  code: string;               // short code, e.g. "WNIH"
  coverageType: CoverageType; // in-house, home, etc.

  startTime: string;          // "17:00" (24h format)
  endTime: string;            // "07:00" or "24h" for full day
  isWeekendEligible: boolean;
  isHolidayEligible: boolean;

  countsTowardBurden: boolean; // whether this shift is included in burden metrics
  isBackupShift?: boolean;     // e.g. jeopardy/backup
  
  // Metadata
  createdAt?: string;          // ISO timestamp
  updatedAt?: string;           // ISO timestamp
  isDeleted?: boolean;        // soft delete flag
}

/**
 * Call Program - a complete call coverage program configuration
 * This is the "catalog" version that extends the engine's CallProgram
 */
export interface CallProgram {
  id: string;
  name: string;                // "Pediatric Cardiology Call"
  specialty: string;           // should align with existing specialty field
  serviceLine?: string;
  site?: string;               // hospital / region
  modelYear: number;

  // Default configuration for this program:
  coverageType: CoverageType;
  shiftTypeIds: string[];      // which shift types are used in this program

  // High-level assumptions (bridge to existing engine):
  defaultAssumptions: CallAssumptions;  // reuse existing type
  
  // Metadata
  createdAt?: string;          // ISO timestamp
  updatedAt?: string;           // ISO timestamp
  isDeleted?: boolean;          // soft delete flag
}

