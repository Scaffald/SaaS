/**
 * Sentry Mock Validator
 *
 * Validates that the Sentry mock matches the real Sentry SDK API
 */

import type { MockValidator, ValidationResult } from '../types';
import { createSuccessResult, createValidationError, createFailedResult } from '../MockValidationFramework';

export class SentryValidator implements MockValidator {
  readonly name = 'Sentry Mock';

  async validate(): Promise<ValidationResult> {
    const start = Date.now();
    const errors = [];

    try {
      const { mockSentry } = await import('../../mocks/externalServices');

      // Validate required methods exist
      const requiredMethods = [
        'init',
        'captureException',
        'captureMessage',
        'setUser',
        'setContext',
        'addBreadcrumb',
      ];

      for (const method of requiredMethods) {
        if (typeof (mockSentry as any)[method] !== 'function') {
          errors.push(createValidationError(
            method,
            'function',
            typeof (mockSentry as any)[method],
            `Sentry mock missing ${method} method`,
            `Add: mockSentry.${method} = vi.fn(...)`
          ));
        }
      }

      // Validate captureException behavior
      if (typeof mockSentry.captureException === 'function') {
        const testError = new Error('Test error');
        const result = mockSentry.captureException(testError);

        if (typeof result !== 'string') {
          errors.push(createValidationError(
            'captureException return value',
            'string (event ID)',
            typeof result,
            'captureException should return an event ID string',
            'Update mock to return a string: return "mock-event-id"'
          ));
        }
      }

      // Validate captureMessage behavior
      if (typeof mockSentry.captureMessage === 'function') {
        const result = mockSentry.captureMessage('Test message');

        if (typeof result !== 'string') {
          errors.push(createValidationError(
            'captureMessage return value',
            'string (event ID)',
            typeof result,
            'captureMessage should return an event ID string',
            'Update mock to return a string: return "mock-event-id"'
          ));
        }
      }

      const duration = Date.now() - start;
      return errors.length > 0
        ? createFailedResult(this.name, errors, duration)
        : createSuccessResult(this.name, duration);

    } catch (error) {
      const duration = Date.now() - start;
      return createFailedResult(
        this.name,
        [createValidationError(
          'import',
          'successful import',
          error instanceof Error ? error.message : 'unknown error',
          'Failed to import Sentry mock'
        )],
        duration
      );
    }
  }
}
