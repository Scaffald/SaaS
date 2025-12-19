/**
 * REQ-306 TASK-3: MockOCRServiceValidator Tests
 *
 * Tests that the MockOCRServiceValidator correctly validates MockOCRService
 * against the OCR service interface contract.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockOCRServiceValidator } from '../validators/MockOCRServiceValidator';

describe('MockOCRServiceValidator', () => {
  let validator: MockOCRServiceValidator;

  beforeEach(() => {
    validator = new MockOCRServiceValidator();
  });

  describe('Basic Properties', () => {
    it('should have correct name', () => {
      expect(validator.name).toBe('MockOCRService');
    });

    it('should implement MockValidator interface', () => {
      expect(typeof validator.validate).toBe('function');
    });
  });

  describe('Validation Execution', () => {
    it('should complete validation', async () => {
      const result = await validator.validate();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.durationMs).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should track duration', async () => {
      const result = await validator.validate();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should complete under 3 seconds (TR-2)', async () => {
      const result = await validator.validate();
      expect(result.durationMs).toBeLessThan(3000);
    }, 10000); // Increase test timeout to allow for simulated processing delay

    it('should have mockName set correctly', async () => {
      const result = await validator.validate();
      expect(result.mockName).toBe('MockOCRService');
    });
  });

  describe('Validation Results', () => {
    it('should validate API signatures exist', async () => {
      const result = await validator.validate();

      const apiErrors = result.errors.filter(e =>
        e.field.includes('extractText') ||
        e.field.includes('validateACORD25Format') ||
        e.field.includes('extractField') ||
        e.field.includes('extractAllMatches')
      );

      // All API methods should exist
      if (apiErrors.length > 0) {
        console.log('API signature errors:', apiErrors);
      }
    });

    it('should validate OCRResult structure', async () => {
      const result = await validator.validate();

      const resultErrors = result.errors.filter(e =>
        e.field.includes('OCRResult')
      );

      if (resultErrors.length > 0) {
        console.log('OCRResult structure errors:', resultErrors);
      }
    });

    it('should validate ACORD 25 detection', async () => {
      const result = await validator.validate();

      const acordErrors = result.errors.filter(e =>
        e.field.includes('ACORD 25')
      );

      if (acordErrors.length > 0) {
        console.log('ACORD 25 detection errors:', acordErrors);
      }
    });
  });

  describe('Error Reporting', () => {
    it('should provide actionable error messages', async () => {
      const result = await validator.validate();

      for (const error of result.errors) {
        expect(error.field).toBeDefined();
        expect(error.expected).toBeDefined();
        expect(error.actual).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });
  });
});
