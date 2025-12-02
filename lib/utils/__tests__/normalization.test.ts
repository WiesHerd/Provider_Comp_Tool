import { normalizeToFTE, normalizeWrvus, normalizeTcc, calculateEffectiveCF } from '../normalization';

describe('normalization utilities', () => {
  describe('normalizeToFTE', () => {
    it('should normalize value to 1.0 FTE', () => {
      expect(normalizeToFTE(200000, 0.5)).toBe(400000);
      expect(normalizeToFTE(200000, 1.0)).toBe(200000);
    });

    it('should return 0 for zero FTE', () => {
      expect(normalizeToFTE(200000, 0)).toBe(0);
    });
  });

  describe('normalizeWrvus', () => {
    it('should normalize wRVUs to 1.0 FTE', () => {
      expect(normalizeWrvus(3000, 0.75)).toBe(4000);
    });
  });

  describe('normalizeTcc', () => {
    it('should normalize TCC to 1.0 FTE', () => {
      expect(normalizeTcc(150000, 0.5)).toBe(300000);
    });
  });

  describe('calculateEffectiveCF', () => {
    it('should calculate effective conversion factor', () => {
      expect(calculateEffectiveCF(200000, 4000)).toBe(50);
    });

    it('should return 0 for zero wRVUs', () => {
      expect(calculateEffectiveCF(200000, 0)).toBe(0);
    });
  });
});














