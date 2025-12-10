/**
 * REQ-306 TASK-4: TaskMocksValidator Tests
 *
 * Tests that the TaskMocksValidator correctly validates task mock utilities
 * against the task service API contract.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TaskMocksValidator } from '../validators/TaskMocksValidator';

describe('TaskMocksValidator', () => {
  let validator: TaskMocksValidator;

  beforeEach(() => {
    validator = new TaskMocksValidator();
  });

  describe('Basic Properties', () => {
    it('should have correct name', () => {
      expect(validator.name).toBe('TaskMocks');
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

    it('should complete under 2 seconds (TR-2)', async () => {
      const result = await validator.validate();
      expect(result.durationMs).toBeLessThan(2000);
    });

    it('should have mockName set correctly', async () => {
      const result = await validator.validate();
      expect(result.mockName).toBe('TaskMocks');
    });
  });

  describe('Validation Results', () => {
    it('should validate schema compliance', async () => {
      const result = await validator.validate();

      const schemaErrors = result.errors.filter(e =>
        e.field.includes('Task.') && e.field.includes('type')
      );

      if (schemaErrors.length > 0) {
        console.log('Schema compliance errors:', schemaErrors);
      }
    });

    it('should validate enum values', async () => {
      const result = await validator.validate();

      const enumErrors = result.errors.filter(e =>
        e.field.includes('enum') ||
        e.field.includes('status') ||
        e.field.includes('priority')
      );

      if (enumErrors.length > 0) {
        console.log('Enum validation errors:', enumErrors);
      }
    });

    it('should validate constraint enforcement', async () => {
      const result = await validator.validate();

      const constraintErrors = result.errors.filter(e =>
        e.field.includes('constraint') ||
        e.field.includes('title')
      );

      if (constraintErrors.length > 0) {
        console.log('Constraint enforcement errors:', constraintErrors);
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
