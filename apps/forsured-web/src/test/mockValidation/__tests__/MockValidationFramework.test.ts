/**
 * REQ-306: Unit tests for MockValidationFramework
 *
 * Tests the core validation framework functionality including:
 * - Singleton pattern
 * - Validator registration
 * - Validation execution
 * - Error reporting
 * - Performance tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MockValidationFramework,
  createValidationError,
  createSuccessResult,
  createFailedResult,
} from '../MockValidationFramework';
import type { MockValidator, ValidationResult } from '../types';

// Mock console methods to capture output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('MockValidationFramework', () => {
  beforeEach(() => {
    // Reset singleton and clear mocks before each test
    MockValidationFramework.resetInstance();
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    MockValidationFramework.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = MockValidationFramework.getInstance();
      const instance2 = MockValidationFramework.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should reset instance when resetInstance is called', () => {
      const instance1 = MockValidationFramework.getInstance();
      MockValidationFramework.resetInstance();
      const instance2 = MockValidationFramework.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Validator Registration', () => {
    it('should register a validator', () => {
      const framework = MockValidationFramework.getInstance();
      const mockValidator: MockValidator = {
        name: 'TestValidator',
        validate: async () => createSuccessResult('TestValidator', 100),
      };

      framework.registerValidator(mockValidator);
      expect(framework.getValidators()).toHaveLength(1);
      expect(framework.getValidators()[0].name).toBe('TestValidator');
    });

    it('should prevent duplicate registration by name', () => {
      const framework = MockValidationFramework.getInstance();
      const validator1: MockValidator = {
        name: 'TestValidator',
        validate: async () => createSuccessResult('TestValidator', 100),
      };
      const validator2: MockValidator = {
        name: 'TestValidator',
        validate: async () => createSuccessResult('TestValidator', 100),
      };

      framework.registerValidator(validator1);
      expect(() => framework.registerValidator(validator2)).toThrow(
        'Validator "TestValidator" is already registered'
      );
    });

    it('should allow multiple different validators', () => {
      const framework = MockValidationFramework.getInstance();
      const validator1: MockValidator = {
        name: 'Validator1',
        validate: async () => createSuccessResult('Validator1', 100),
      };
      const validator2: MockValidator = {
        name: 'Validator2',
        validate: async () => createSuccessResult('Validator2', 100),
      };

      framework.registerValidator(validator1);
      framework.registerValidator(validator2);
      expect(framework.getValidators()).toHaveLength(2);
    });

    it('should clear all validators', () => {
      const framework = MockValidationFramework.getInstance();
      const validator: MockValidator = {
        name: 'TestValidator',
        validate: async () => createSuccessResult('TestValidator', 100),
      };

      framework.registerValidator(validator);
      expect(framework.getValidators()).toHaveLength(1);

      framework.clearValidators();
      expect(framework.getValidators()).toHaveLength(0);
    });

    it('should return a copy of validators, not the internal array', () => {
      const framework = MockValidationFramework.getInstance();
      const validators = framework.getValidators();
      expect(validators).not.toBe(framework.getValidators());
    });
  });

  describe('Validation Execution', () => {
    it('should return success when no validators are registered', async () => {
      const framework = MockValidationFramework.getInstance();
      const results = await framework.validateAll();

      expect(results.allPassed).toBe(true);
      expect(results.passedCount).toBe(0);
      expect(results.failedCount).toBe(0);
      expect(results.results).toHaveLength(0);
    });

    it('should execute a single passing validator', async () => {
      const framework = MockValidationFramework.getInstance();
      const validator: MockValidator = {
        name: 'PassingValidator',
        validate: async () => createSuccessResult('PassingValidator', 50),
      };

      framework.registerValidator(validator);
      const results = await framework.validateAll();

      expect(results.allPassed).toBe(true);
      expect(results.passedCount).toBe(1);
      expect(results.failedCount).toBe(0);
      expect(results.results).toHaveLength(1);
      expect(results.results[0].success).toBe(true);
    });

    it('should execute a single failing validator', async () => {
      const framework = MockValidationFramework.getInstance();
      const validator: MockValidator = {
        name: 'FailingValidator',
        validate: async () => createFailedResult(
          'FailingValidator',
          [createValidationError('testField', 'expected', 'actual', 'Test error')],
          50
        ),
      };

      framework.registerValidator(validator);
      const results = await framework.validateAll();

      expect(results.allPassed).toBe(false);
      expect(results.passedCount).toBe(0);
      expect(results.failedCount).toBe(1);
      expect(results.results[0].errors).toHaveLength(1);
    });

    it('should execute multiple validators', async () => {
      const framework = MockValidationFramework.getInstance();

      for (let i = 0; i < 3; i++) {
        framework.registerValidator({
          name: `Validator${i}`,
          validate: async () => createSuccessResult(`Validator${i}`, 10),
        });
      }

      const results = await framework.validateAll({ failFast: false });

      expect(results.allPassed).toBe(true);
      expect(results.passedCount).toBe(3);
      expect(results.results).toHaveLength(3);
    });

    it('should stop on first failure in failFast mode', async () => {
      const framework = MockValidationFramework.getInstance();

      framework.registerValidator({
        name: 'Passing1',
        validate: async () => createSuccessResult('Passing1', 10),
      });

      framework.registerValidator({
        name: 'Failing',
        validate: async () => createFailedResult(
          'Failing',
          [createValidationError('test', 'a', 'b', 'error')],
          10
        ),
      });

      framework.registerValidator({
        name: 'Passing2',
        validate: async () => createSuccessResult('Passing2', 10),
      });

      const results = await framework.validateAll({ failFast: true });

      expect(results.allPassed).toBe(false);
      // In failFast mode, execution stops after failure
      // The failing validator should be in results
      expect(results.failedCount).toBe(1);
    });

    it('should continue on failure when failFast is false', async () => {
      const framework = MockValidationFramework.getInstance();

      framework.registerValidator({
        name: 'Passing1',
        validate: async () => createSuccessResult('Passing1', 10),
      });

      framework.registerValidator({
        name: 'Failing',
        validate: async () => createFailedResult(
          'Failing',
          [createValidationError('test', 'a', 'b', 'error')],
          10
        ),
      });

      framework.registerValidator({
        name: 'Passing2',
        validate: async () => createSuccessResult('Passing2', 10),
      });

      const results = await framework.validateAll({ failFast: false });

      expect(results.allPassed).toBe(false);
      expect(results.results).toHaveLength(3);
      expect(results.passedCount).toBe(2);
      expect(results.failedCount).toBe(1);
    });

    it('should track total execution time', async () => {
      const framework = MockValidationFramework.getInstance();
      const delay = 50;

      framework.registerValidator({
        name: 'DelayedValidator',
        validate: async () => {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return createSuccessResult('DelayedValidator', delay);
        },
      });

      const results = await framework.validateAll();

      // Total duration should be at least the delay
      expect(results.totalDurationMs).toBeGreaterThanOrEqual(delay - 10); // Allow some margin
    });

    it('should handle validator exceptions gracefully', async () => {
      const framework = MockValidationFramework.getInstance();

      framework.registerValidator({
        name: 'ThrowingValidator',
        validate: async () => {
          throw new Error('Validator crashed!');
        },
      });

      const results = await framework.validateAll();

      expect(results.allPassed).toBe(false);
      expect(results.failedCount).toBe(1);
      expect(results.results[0].errors[0].actual).toContain('Validator crashed!');
    });
  });

  describe('Options', () => {
    it('should apply options via setOptions', async () => {
      const framework = MockValidationFramework.getInstance();
      framework.setOptions({ verbose: true });

      // Just verify it doesn't throw
      await framework.validateAll();
    });

    it('should allow override options in validateAll', async () => {
      const framework = MockValidationFramework.getInstance();
      framework.setOptions({ failFast: true });

      // Override with failFast: false
      framework.registerValidator({
        name: 'Failing1',
        validate: async () => createFailedResult(
          'Failing1',
          [createValidationError('test', 'a', 'b', 'error')],
          10
        ),
      });

      framework.registerValidator({
        name: 'Failing2',
        validate: async () => createFailedResult(
          'Failing2',
          [createValidationError('test', 'a', 'b', 'error')],
          10
        ),
      });

      const results = await framework.validateAll({ failFast: false });

      // Both validators should have run despite failures
      expect(results.results).toHaveLength(2);
      expect(results.failedCount).toBe(2);
    });
  });

  describe('Helper Functions', () => {
    it('createValidationError should create proper error object', () => {
      const error = createValidationError(
        'fieldName',
        'expectedValue',
        'actualValue',
        'Error message',
        'How to fix it'
      );

      expect(error.field).toBe('fieldName');
      expect(error.expected).toBe('expectedValue');
      expect(error.actual).toBe('actualValue');
      expect(error.message).toBe('Error message');
      expect(error.howToFix).toBe('How to fix it');
    });

    it('createSuccessResult should create proper success result', () => {
      const result = createSuccessResult('MockName', 100);

      expect(result.success).toBe(true);
      expect(result.mockName).toBe('MockName');
      expect(result.errors).toHaveLength(0);
      expect(result.durationMs).toBe(100);
    });

    it('createFailedResult should create proper failed result', () => {
      const errors = [
        createValidationError('field1', 'a', 'b', 'error1'),
        createValidationError('field2', 'c', 'd', 'error2'),
      ];
      const result = createFailedResult('MockName', errors, 150);

      expect(result.success).toBe(false);
      expect(result.mockName).toBe('MockName');
      expect(result.errors).toHaveLength(2);
      expect(result.durationMs).toBe(150);
    });
  });

  describe('Console Output', () => {
    it('should output success message for passing validator', async () => {
      const framework = MockValidationFramework.getInstance();
      framework.registerValidator({
        name: 'PassingValidator',
        validate: async () => createSuccessResult('PassingValidator', 50),
      });

      await framework.validateAll();

      // Check that console.log was called with success indicator
      const logCalls = mockConsoleLog.mock.calls.flat().join(' ');
      expect(logCalls).toContain('PassingValidator');
      expect(logCalls).toContain('✓');
    });

    it('should output error details for failing validator', async () => {
      const framework = MockValidationFramework.getInstance();
      framework.registerValidator({
        name: 'FailingValidator',
        validate: async () => createFailedResult(
          'FailingValidator',
          [createValidationError('testField', 'expected', 'actual', 'Test error message')],
          50
        ),
      });

      await framework.validateAll();

      const logCalls = mockConsoleLog.mock.calls.flat().join(' ');
      expect(logCalls).toContain('FailingValidator');
      expect(logCalls).toContain('✗');
      expect(logCalls).toContain('testField');
      expect(logCalls).toContain('expected');
      expect(logCalls).toContain('actual');
    });
  });
});
