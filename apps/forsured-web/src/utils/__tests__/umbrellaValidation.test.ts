/**
 * Umbrella Policy Validation Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateUmbrellaLimits,
  calculateMinimumUmbrellaLimit,
  formatUnderlyingCoverages,
  formatPolicyType,
} from '../umbrellaValidation';
import { InsurancePolicy } from '../../types';

// Helper to create mock policies
const createMockPolicy = (
  overrides: Partial<InsurancePolicy> = {}
): InsurancePolicy => ({
  id: 'test-id',
  organization_id: 'org-1',
  policy_type: 'GL',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe('umbrellaValidation', () => {
  describe('validateUmbrellaLimits', () => {
    it('returns success for non-umbrella policies', () => {
      const glPolicy = createMockPolicy({
        policy_type: 'GL',
        each_occurrence_limit: 1000000,
      });

      const result = validateUmbrellaLimits(glPolicy, []);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns success for umbrella with no underlying policies', () => {
      const umbrellaPolicy = createMockPolicy({
        policy_type: 'Umbrella',
        each_occurrence_limit: 2000000,
      });

      const result = validateUmbrellaLimits(umbrellaPolicy, []);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns success for umbrella with sufficient limits', () => {
      const umbrellaPolicy = createMockPolicy({
        id: 'umbrella-1',
        policy_type: 'Umbrella',
        each_occurrence_limit: 2000000,
      });

      const glPolicy = createMockPolicy({
        id: 'gl-1',
        policy_type: 'GL',
        each_occurrence_limit: 1000000,
      });

      const autoPolicy = createMockPolicy({
        id: 'auto-1',
        policy_type: 'Auto',
        each_occurrence_limit: 1000000,
      });

      const result = validateUmbrellaLimits(umbrellaPolicy, [glPolicy, autoPolicy]);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error for umbrella with insufficient limit', () => {
      const umbrellaPolicy = createMockPolicy({
        id: 'umbrella-1',
        policy_type: 'Umbrella',
        each_occurrence_limit: 1000000,
      });

      const glPolicy = createMockPolicy({
        id: 'gl-1',
        policy_type: 'GL',
        each_occurrence_limit: 2000000,
      });

      const result = validateUmbrellaLimits(umbrellaPolicy, [glPolicy]);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Umbrella limit ($1,000,000)');
      expect(result.errors[0].message).toContain('GL limit ($2,000,000)');
      expect(result.errors[0].underlyingPolicyType).toBe('GL');
    });

    it('returns multiple errors for multiple insufficient underlying policies', () => {
      const umbrellaPolicy = createMockPolicy({
        id: 'umbrella-1',
        policy_type: 'Umbrella',
        each_occurrence_limit: 1000000,
      });

      const glPolicy = createMockPolicy({
        id: 'gl-1',
        policy_type: 'GL',
        each_occurrence_limit: 2000000,
      });

      const autoPolicy = createMockPolicy({
        id: 'auto-1',
        policy_type: 'Auto',
        each_occurrence_limit: 1500000,
      });

      const result = validateUmbrellaLimits(umbrellaPolicy, [glPolicy, autoPolicy]);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('returns error for umbrella without limit set', () => {
      const umbrellaPolicy = createMockPolicy({
        id: 'umbrella-1',
        policy_type: 'Umbrella',
        // No limits set
      });

      const glPolicy = createMockPolicy({
        id: 'gl-1',
        policy_type: 'GL',
        each_occurrence_limit: 1000000,
      });

      const result = validateUmbrellaLimits(umbrellaPolicy, [glPolicy]);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toBe('Umbrella policy must have a coverage limit set');
    });

    it('uses aggregate_limit when each_occurrence_limit is not set', () => {
      const umbrellaPolicy = createMockPolicy({
        id: 'umbrella-1',
        policy_type: 'Umbrella',
        aggregate_limit: 3000000, // Uses aggregate since no occurrence limit
      });

      const glPolicy = createMockPolicy({
        id: 'gl-1',
        policy_type: 'GL',
        aggregate_limit: 2000000,
      });

      const result = validateUmbrellaLimits(umbrellaPolicy, [glPolicy]);

      expect(result.success).toBe(true);
    });
  });

  describe('calculateMinimumUmbrellaLimit', () => {
    it('returns 0 for empty array', () => {
      expect(calculateMinimumUmbrellaLimit([])).toBe(0);
    });

    it('returns max limit from underlying policies', () => {
      const policies = [
        createMockPolicy({ each_occurrence_limit: 1000000 }),
        createMockPolicy({ each_occurrence_limit: 2000000 }),
        createMockPolicy({ each_occurrence_limit: 1500000 }),
      ];

      expect(calculateMinimumUmbrellaLimit(policies)).toBe(2000000);
    });
  });

  describe('formatUnderlyingCoverages', () => {
    it('returns empty string for empty array', () => {
      expect(formatUnderlyingCoverages([])).toBe('');
    });

    it('formats single coverage', () => {
      const policies = [createMockPolicy({ policy_type: 'GL' })];
      expect(formatUnderlyingCoverages(policies)).toBe('GL');
    });

    it('formats multiple coverages', () => {
      const policies = [
        createMockPolicy({ policy_type: 'GL' }),
        createMockPolicy({ policy_type: 'Auto' }),
        createMockPolicy({ policy_type: 'WC' }),
      ];
      expect(formatUnderlyingCoverages(policies)).toBe('GL, Auto, Workers Comp');
    });
  });

  describe('formatPolicyType', () => {
    it('formats GL correctly', () => {
      expect(formatPolicyType('GL')).toBe('GL');
    });

    it('formats WC to Workers Comp', () => {
      expect(formatPolicyType('WC')).toBe('Workers Comp');
    });

    it('formats Auto correctly', () => {
      expect(formatPolicyType('Auto')).toBe('Auto');
    });

    it('formats Professional Liability correctly', () => {
      expect(formatPolicyType('Professional Liability')).toBe('Professional Liability');
    });
  });
});
