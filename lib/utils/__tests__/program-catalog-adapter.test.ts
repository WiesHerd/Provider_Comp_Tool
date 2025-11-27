/**
 * Unit Tests for Program Catalog Adapter
 */

import {
  mapCatalogProgramToEngineProgram,
  mapCatalogProgramToContext,
  getDefaultAssumptionsFromProgram,
} from '@/lib/utils/program-catalog-adapter';
import { CallProgram } from '@/types/call-program';

describe('program-catalog-adapter', () => {
  const sampleCatalogProgram: CallProgram = {
    id: 'test-program',
    name: 'Test Program',
    specialty: 'Pediatrics',
    serviceLine: 'Cardiology',
    site: 'Main Campus',
    modelYear: 2024,
    coverageType: 'In-house',
    shiftTypeIds: ['shift-1', 'shift-2'],
    defaultAssumptions: {
      weekdayCallsPerMonth: 8,
      weekendCallsPerMonth: 4,
      holidaysPerYear: 12,
    },
  };

  describe('mapCatalogProgramToEngineProgram', () => {
    it('should map catalog program to engine program with provided defaults', () => {
      const result = mapCatalogProgramToEngineProgram(sampleCatalogProgram, 4, '1-in-4');

      expect(result.modelYear).toBe(2024);
      expect(result.specialty).toBe('Pediatrics');
      expect(result.serviceLine).toBe('Cardiology');
      expect(result.providersOnCall).toBe(4);
      expect(result.rotationRatio).toBe('1-in-4');
    });

    it('should use default values when not provided', () => {
      const result = mapCatalogProgramToEngineProgram(sampleCatalogProgram);

      expect(result.providersOnCall).toBe(0);
      expect(result.rotationRatio).toBe('1-in-4');
    });
  });

  describe('mapCatalogProgramToContext', () => {
    it('should map catalog program to CallPayContext', () => {
      const result = mapCatalogProgramToContext(sampleCatalogProgram, 4, 4);

      expect(result.specialty).toBe('Pediatrics');
      expect(result.serviceLine).toBe('Cardiology');
      expect(result.providersOnCall).toBe(4);
      expect(result.rotationRatio).toBe(4);
      expect(result.modelYear).toBe(2024);
    });

    it('should use default values when not provided', () => {
      const result = mapCatalogProgramToContext(sampleCatalogProgram);

      expect(result.providersOnCall).toBe(0);
      expect(result.rotationRatio).toBe(4);
    });
  });

  describe('getDefaultAssumptionsFromProgram', () => {
    it('should return default assumptions from program', () => {
      const result = getDefaultAssumptionsFromProgram(sampleCatalogProgram);

      expect(result.weekdayCallsPerMonth).toBe(8);
      expect(result.weekendCallsPerMonth).toBe(4);
      expect(result.holidaysPerYear).toBe(12);
    });
  });
});


