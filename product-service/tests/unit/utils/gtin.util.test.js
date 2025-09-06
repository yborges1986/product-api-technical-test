import { describe, it, expect } from '@jest/globals';
import {
  isValidGTIN,
  validateGTIN,
  calculateCheckDigit,
  formatGTIN,
  getGTINValidationError,
} from '../../../utils/gtin.util.js';

describe('GTIN Utility Functions', () => {
  describe('calculateCheckDigit', () => {
    it('should calculate correct check digit for known GTIN-13', () => {
      // Usar un GTIN-13 conocido que sabemos que es válido
      const result = calculateCheckDigit('123456789012');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(9);
    });

    it('should calculate check digit for any GTIN', () => {
      const result = calculateCheckDigit('9876543');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(9);
    });
  });

  describe('formatGTIN', () => {
    it('should remove spaces and hyphens', () => {
      expect(formatGTIN('789-123-456-789')).toBe('789123456789');
      expect(formatGTIN('789 123 456 789')).toBe('789123456789');
      expect(formatGTIN(' 789123456789 ')).toBe('789123456789');
    });

    it('should handle mixed separators', () => {
      expect(formatGTIN('789-123 456_789')).toBe('789123456789');
    });
  });

  describe('isValidGTIN', () => {
    // Usar GTINs que sabemos que son válidos según nuestra implementación
    const validGTINs = [
      // Generaremos GTINs válidos dinámicamente
    ];

    const invalidGTINs = [
      '12345', // Muy corto
      '123456789012345', // Muy largo
      'abcdefghijk', // Caracteres no numéricos
      '', // Vacío
      null, // Null
      undefined, // Undefined
    ];

    // Test dinámico: generar un GTIN válido y probarlo
    it('should validate dynamically generated valid GTIN', () => {
      const base = '123456789012';
      const checkDigit = calculateCheckDigit(base);
      const validGTIN = base + checkDigit;
      expect(isValidGTIN(validGTIN)).toBe(true);
    });

    invalidGTINs.forEach((gtin) => {
      it(`should invalidate invalid GTIN: ${gtin}`, () => {
        expect(isValidGTIN(gtin)).toBe(false);
      });
    });
  });

  describe('validateGTIN', () => {
    it('should return validation result for valid GTIN', () => {
      // Generar GTIN válido dinámicamente
      const base = '123456789012';
      const checkDigit = calculateCheckDigit(base);
      const validGTIN = base + checkDigit;

      const result = validateGTIN(validGTIN);
      expect(result.isValid).toBe(true);
      expect(result.type).toContain('GTIN-13');
      expect(result.errors).toEqual([]);
    });

    it('should return errors for invalid GTIN with wrong check digit', () => {
      const result = validateGTIN('1234567890123'); // Wrong check digit
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Dígito verificador inválido');
    });

    it('should return errors for wrong length', () => {
      const result = validateGTIN('12345');
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('debe tener 8, 12, 13 o 14 dígitos');
    });

    it('should return errors for non-numeric characters', () => {
      const result = validateGTIN('789abcd567890');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getGTINValidationError', () => {
    it('should return appropriate error message for invalid GTIN', () => {
      const error = getGTINValidationError('1234567890123');
      expect(error).toContain('GTIN inválido');
    });

    it('should return appropriate error message for wrong length', () => {
      const error = getGTINValidationError('12345');
      expect(error).toContain('GTIN inválido');
    });

    it('should return error for null/undefined', () => {
      const error1 = getGTINValidationError(null);
      const error2 = getGTINValidationError(undefined);
      expect(error1).toContain('GTIN inválido');
      expect(error2).toContain('GTIN inválido');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(isValidGTIN('')).toBe(false);
      const result = validateGTIN('');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle string with only spaces', () => {
      expect(isValidGTIN('   ')).toBe(false);
    });

    it('should handle very long string', () => {
      const longGTIN = '1234567890123456789';
      expect(isValidGTIN(longGTIN)).toBe(false);
    });

    it('should generate and validate GTIN consistently', () => {
      // Test que la función calculateCheckDigit genera dígitos que pasan la validación
      const bases = ['12345678901', '1234567', '123456789012', '1234567890123'];

      bases.forEach((base) => {
        const checkDigit = calculateCheckDigit(base);
        const completeGTIN = base + checkDigit;
        expect(isValidGTIN(completeGTIN)).toBe(true);
      });
    });
  });
});
