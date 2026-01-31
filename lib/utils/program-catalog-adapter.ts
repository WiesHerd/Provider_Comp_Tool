/**
 * Program Catalog Adapter
 * 
 * Utilities to map between catalog-level CallProgram and engine-level CallProgram
 */

import { CallProgram as CatalogCallProgram } from '@/types/call-program';
import { CallProgram as EngineCallProgram } from '@/types/call-pay-engine';
import { CallPayContext } from '@/types/call-pay';

/**
 * Map catalog CallProgram to engine CallProgram
 * Note: Engine CallProgram requires providersOnCall and rotationRatio,
 * which are not in the catalog version. These should be provided separately.
 */
export function mapCatalogProgramToEngineProgram(
  catalogProgram: CatalogCallProgram,
  providersOnCall: number = 0,
  rotationRatio: string = '1-in-4'
): EngineCallProgram {
  return {
    modelYear: catalogProgram.modelYear,
    specialty: catalogProgram.specialty,
    serviceLine: catalogProgram.serviceLine,
    providersOnCall,
    rotationRatio,
  };
}

/**
 * Map catalog CallProgram to CallPayContext (for UI state)
 */
export function mapCatalogProgramToContext(
  catalogProgram: CatalogCallProgram,
  providersOnCall: number = 0,
  rotationRatio: number = 4
): CallPayContext {
  return {
    specialty: catalogProgram.specialty as any, // Cast to Specialty type
    serviceLine: catalogProgram.serviceLine || '',
    providersOnCall,
    rotationRatio,
    modelYear: catalogProgram.modelYear,
  };
}

/**
 * Get default assumptions from catalog program
 */
export function getDefaultAssumptionsFromProgram(
  catalogProgram: CatalogCallProgram
) {
  return catalogProgram.defaultAssumptions;
}























