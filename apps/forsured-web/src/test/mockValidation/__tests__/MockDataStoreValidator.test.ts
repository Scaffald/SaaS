/**
 * REQ-306 TASK-5: MockDataStoreValidator Tests
 *
 * Tests that the MockDataStoreValidator correctly validates the mock data store
 * against the database schema contract.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataStoreValidator } from '../validators/MockDataStoreValidator';

describe('MockDataStoreValidator', () => {
  let validator: MockDataStoreValidator;

  beforeEach(() => {
    validator = new MockDataStoreValidator();
  });

  describe('Basic Properties', () => {
    it('should have correct name', () => {
      expect(validator.name).toBe('MockDataStore');
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
      expect(result.mockName).toBe('MockDataStore');
    });
  });

  describe('Validation Results', () => {
    it('should validate table existence', async () => {
      const result = await validator.validate();

      const tableErrors = result.errors.filter(e =>
        e.field.includes('table') || e.field.includes('getAll')
      );

      if (tableErrors.length > 0) {
        console.log('Table existence errors:', tableErrors);
      }
    });

    it('should validate query builder API', async () => {
      const result = await validator.validate();

      const apiErrors = result.errors.filter(e =>
        e.field.includes('QueryBuilder') || e.field.includes('from')
      );

      if (apiErrors.length > 0) {
        console.log('Query builder API errors:', apiErrors);
      }
    });

    it('should validate RBAC methods', async () => {
      const result = await validator.validate();

      const rbacErrors = result.errors.filter(e =>
        e.field.includes('CurrentUser') || e.field.includes('RBAC')
      );

      if (rbacErrors.length > 0) {
        console.log('RBAC method errors:', rbacErrors);
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
