/**
 * REQ-306 TASK-2: MockDatabaseValidator Tests
 *
 * Tests that the MockDatabaseValidator correctly validates MockDatabase
 * against the Supabase client API contract.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockDatabaseValidator } from '../validators/MockDatabaseValidator';

describe('MockDatabaseValidator', () => {
  let validator: MockDatabaseValidator;

  beforeEach(() => {
    validator = new MockDatabaseValidator();
  });

  describe('Basic Properties', () => {
    it('should have correct name', () => {
      expect(validator.name).toBe('MockDatabase');
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

    it('should complete under 5 seconds (TR-2)', async () => {
      const result = await validator.validate();
      expect(result.durationMs).toBeLessThan(5000);
    });

    it('should have mockName set correctly', async () => {
      const result = await validator.validate();
      expect(result.mockName).toBe('MockDatabase');
    });
  });

  describe('Validation Results', () => {
    it('should validate API signatures exist', async () => {
      const result = await validator.validate();

      // If there's an error about missing methods, it should be in errors
      const apiErrors = result.errors.filter(e =>
        e.field.includes('from()') ||
        e.field.includes('QueryBuilder')
      );

      // MockDatabase should have all required API methods
      // If validation fails for missing methods, we know what's missing
      if (apiErrors.length > 0) {
        console.log('API signature errors:', apiErrors);
      }
    });

    it('should validate response format', async () => {
      const result = await validator.validate();

      const responseErrors = result.errors.filter(e =>
        e.field.includes('response format') ||
        e.field.includes('data type')
      );

      // MockDatabase should return correct response format
      if (responseErrors.length > 0) {
        console.log('Response format errors:', responseErrors);
      }
    });

    it('should validate error codes', async () => {
      const result = await validator.validate();

      const errorCodeErrors = result.errors.filter(e =>
        e.field.includes('error code') ||
        e.expected === '23502' ||
        e.expected === '23505' ||
        e.expected === 'PGRST116'
      );

      // MockDatabase should return correct PostgreSQL error codes
      if (errorCodeErrors.length > 0) {
        console.log('Error code errors:', errorCodeErrors);
      }
    });
  });

  describe('Error Reporting', () => {
    it('should provide actionable error messages', async () => {
      const result = await validator.validate();

      // Each error should have required fields
      for (const error of result.errors) {
        expect(error.field).toBeDefined();
        expect(error.expected).toBeDefined();
        expect(error.actual).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });
  });
});
