/**
 * REQ-306: StorageServiceValidator Tests
 *
 * Tests that the StorageServiceValidator correctly validates the storage service
 * mocks against the database schema contract.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StorageServiceValidator } from '../validators/StorageServiceValidator';

describe('StorageServiceValidator', () => {
  let validator: StorageServiceValidator;

  beforeEach(() => {
    validator = new StorageServiceValidator();
  });

  describe('Basic Properties', () => {
    it('should have correct name', () => {
      expect(validator.name).toBe('StorageService');
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
    });

    it('should have mockName set correctly', async () => {
      const result = await validator.validate();
      expect(result.mockName).toBe('StorageService');
    });
  });

  describe('Validation Results', () => {
    it('should validate DocumentService API methods', async () => {
      const result = await validator.validate();

      const apiErrors = result.errors.filter(e =>
        e.field.includes('DocumentService')
      );

      // Should pass - DocumentService has all required methods
      expect(apiErrors.length).toBe(0);
    });

    it('should validate file validation logic', async () => {
      const result = await validator.validate();

      const validationErrors = result.errors.filter(e =>
        e.field.includes('validateFile') ||
        e.field.includes('MAX_FILE_SIZE') ||
        e.field.includes('MIN_FILE_SIZE') ||
        e.field.includes('ALLOWED_FILE')
      );

      // Should pass - validation logic is correct
      expect(validationErrors.length).toBe(0);
    });

    it('should validate documents table schema', async () => {
      const result = await validator.validate();

      const schemaErrors = result.errors.filter(e =>
        e.field.includes('documents table') ||
        e.field.includes('from("documents")')
      );

      // Should pass - documents table exists with correct schema
      expect(schemaErrors.length).toBe(0);
    });

    it('should validate CRUD operations', async () => {
      const result = await validator.validate();

      const crudErrors = result.errors.filter(e =>
        e.field.includes('INSERT') ||
        e.field.includes('SELECT') ||
        e.field.includes('UPDATE') ||
        e.field.includes('DELETE') ||
        e.field.includes('CRUD')
      );

      // Should pass - CRUD operations work correctly
      expect(crudErrors.length).toBe(0);
    });

    it('should validate response format', async () => {
      const result = await validator.validate();

      const responseErrors = result.errors.filter(e =>
        e.field.includes('response') ||
        e.field.includes('single()')
      );

      // Should pass - response format matches Supabase contract
      expect(responseErrors.length).toBe(0);
    });

    it('should pass all validations', async () => {
      const result = await validator.validate();

      if (!result.success) {
        console.log('Validation errors:', result.errors);
      }

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
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
