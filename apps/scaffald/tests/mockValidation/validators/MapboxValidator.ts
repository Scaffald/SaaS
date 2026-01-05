/**
 * Mapbox Mock Validator
 *
 * Validates that the Mapbox mock matches the real Mapbox API
 */

import type { MockValidator, ValidationResult } from '../types';
import { createSuccessResult, createValidationError, createFailedResult } from '../MockValidationFramework';

export class MapboxValidator implements MockValidator {
  readonly name = 'Mapbox Mock';

  async validate(): Promise<ValidationResult> {
    const start = Date.now();
    const errors = [];

    try {
      const { mockMapbox } = await import('../../mocks/externalServices');

      // Validate geocode methods exist
      if (typeof mockMapbox.geocode?.forward !== 'function') {
        errors.push(createValidationError(
          'geocode.forward',
          'function',
          typeof mockMapbox.geocode?.forward,
          'Mapbox mock missing geocode.forward method',
          'Add: mockMapbox.geocode.forward = vi.fn(async (query) => ({ ... }))'
        ));
      }

      if (typeof mockMapbox.geocode?.reverse !== 'function') {
        errors.push(createValidationError(
          'geocode.reverse',
          'function',
          typeof mockMapbox.geocode?.reverse,
          'Mapbox mock missing geocode.reverse method',
          'Add: mockMapbox.geocode.reverse = vi.fn(async (lon, lat) => ({ ... }))'
        ));
      }

      // Validate forward geocoding behavior
      if (typeof mockMapbox.geocode?.forward === 'function') {
        const result = await mockMapbox.geocode.forward('San Francisco');

        if (!result || result.type !== 'FeatureCollection') {
          errors.push(createValidationError(
            'geocode.forward response type',
            'FeatureCollection',
            result?.type || 'undefined',
            'forward geocoding should return a GeoJSON FeatureCollection',
            'Update mock to return: { type: "FeatureCollection", features: [...] }'
          ));
        }

        if (!Array.isArray(result?.features)) {
          errors.push(createValidationError(
            'geocode.forward response.features',
            'array',
            typeof result?.features,
            'FeatureCollection must have a features array',
            'Add features array to mock response'
          ));
        }
      }

      // Validate reverse geocoding behavior
      if (typeof mockMapbox.geocode?.reverse === 'function') {
        const result = await mockMapbox.geocode.reverse(-122.4194, 37.7749);

        if (!result || result.type !== 'FeatureCollection') {
          errors.push(createValidationError(
            'geocode.reverse response type',
            'FeatureCollection',
            result?.type || 'undefined',
            'reverse geocoding should return a GeoJSON FeatureCollection',
            'Update mock to return: { type: "FeatureCollection", features: [...] }'
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
          'Failed to import Mapbox mock'
        )],
        duration
      );
    }
  }
}
