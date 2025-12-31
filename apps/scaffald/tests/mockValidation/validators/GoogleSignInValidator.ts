/**
 * Google Sign-In Mock Validator
 *
 * Validates that the Google Sign-In mock matches the real SDK API
 */

import type { MockValidator, ValidationResult } from '../types';
import { createSuccessResult, createValidationError, createFailedResult } from '../MockValidationFramework';

export class GoogleSignInValidator implements MockValidator {
  readonly name = 'Google Sign-In Mock';

  async validate(): Promise<ValidationResult> {
    const start = Date.now();
    const errors = [];

    try {
      const { mockGoogleSignIn } = await import('../../mocks/externalServices');

      // Validate required methods exist
      const requiredMethods = [
        'configure',
        'hasPlayServices',
        'signIn',
        'signOut',
        'isSignedIn',
      ];

      for (const method of requiredMethods) {
        if (typeof (mockGoogleSignIn as any)[method] !== 'function') {
          errors.push(createValidationError(
            method,
            'function',
            typeof (mockGoogleSignIn as any)[method],
            `Google Sign-In mock missing ${method} method`,
            `Add: mockGoogleSignIn.${method} = vi.fn(...)`
          ));
        }
      }

      // Validate signIn behavior
      if (typeof mockGoogleSignIn.signIn === 'function') {
        const result = await mockGoogleSignIn.signIn();

        if (!result || typeof result !== 'object') {
          errors.push(createValidationError(
            'signIn return value',
            'object with idToken and user',
            typeof result,
            'signIn should return an object with idToken and user',
            'Update mock to return: { idToken: "...", user: { ... } }'
          ));
        } else {
          if (!result.idToken) {
            errors.push(createValidationError(
              'signIn result.idToken',
              'string',
              typeof result.idToken,
              'signIn result must include idToken',
              'Add idToken to mock response'
            ));
          }

          if (!result.user || !result.user.email) {
            errors.push(createValidationError(
              'signIn result.user.email',
              'string',
              typeof result.user?.email,
              'signIn result.user must include email',
              'Add user.email to mock response'
            ));
          }
        }
      }

      // Validate hasPlayServices behavior
      if (typeof mockGoogleSignIn.hasPlayServices === 'function') {
        const result = await mockGoogleSignIn.hasPlayServices();

        if (typeof result !== 'boolean') {
          errors.push(createValidationError(
            'hasPlayServices return value',
            'boolean',
            typeof result,
            'hasPlayServices should return a boolean',
            'Update mock to return: return true or false'
          ));
        }
      }

      // Validate isSignedIn behavior
      if (typeof mockGoogleSignIn.isSignedIn === 'function') {
        const result = await mockGoogleSignIn.isSignedIn();

        if (typeof result !== 'boolean') {
          errors.push(createValidationError(
            'isSignedIn return value',
            'boolean',
            typeof result,
            'isSignedIn should return a boolean',
            'Update mock to return: return true or false'
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
          'Failed to import Google Sign-In mock'
        )],
        duration
      );
    }
  }
}
