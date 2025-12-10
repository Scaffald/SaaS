/**
 * Umbrella Policy Validation Utilities (REQ-270)
 * Validates that umbrella policies have sufficient limits to cover underlying policies
 */

import { InsurancePolicy, InsurancePolicyType } from '../types';

export interface UmbrellaValidationError {
  field: string;
  message: string;
  underlyingPolicyType?: InsurancePolicyType;
  underlyingLimit?: number;
  umbrellaLimit?: number;
}

export interface UmbrellaValidationResult {
  success: boolean;
  errors: UmbrellaValidationError[];
}

/**
 * Format currency for display in error messages
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format policy type for display
 * Converts policy_type to readable format (e.g., 'GL' stays 'GL', 'Auto' stays 'Auto')
 */
export function formatPolicyType(type: InsurancePolicyType): string {
  const typeMap: Record<InsurancePolicyType, string> = {
    'GL': 'GL',
    'WC': 'Workers Comp',
    'Auto': 'Auto',
    'Umbrella': 'Umbrella',
    'Professional Liability': 'Professional Liability',
    'Other': 'Other',
  };
  return typeMap[type] || type;
}

/**
 * Get the effective limit for an umbrella policy
 * Uses each_occurrence_limit if available, otherwise aggregate_limit
 */
function getEffectiveLimit(policy: InsurancePolicy): number {
  return policy.each_occurrence_limit || policy.aggregate_limit || 0;
}

/**
 * Validate that umbrella policy limits are sufficient for all underlying policies
 *
 * Business Rules:
 * - Umbrella limit must be >= each underlying policy's limit
 * - Validates against each_occurrence_limit primarily, falls back to aggregate_limit
 * - Only validates when policy type is 'Umbrella' and underlying policies exist
 *
 * @param umbrellaPolicy - The umbrella policy to validate
 * @param underlyingPolicies - Array of policies that the umbrella extends
 * @returns Validation result with success boolean and error messages
 */
export function validateUmbrellaLimits(
  umbrellaPolicy: InsurancePolicy,
  underlyingPolicies: InsurancePolicy[]
): UmbrellaValidationResult {
  const errors: UmbrellaValidationError[] = [];

  // Skip validation for non-umbrella policies
  if (umbrellaPolicy.policy_type !== 'Umbrella') {
    return { success: true, errors: [] };
  }

  // Skip validation if no underlying policies
  if (!underlyingPolicies || underlyingPolicies.length === 0) {
    return { success: true, errors: [] };
  }

  const umbrellaLimit = getEffectiveLimit(umbrellaPolicy);

  // Validate umbrella has a limit set
  if (!umbrellaLimit || umbrellaLimit <= 0) {
    errors.push({
      field: 'aggregate_limit',
      message: 'Umbrella policy must have a coverage limit set',
    });
    return { success: false, errors };
  }

  // Check each underlying policy
  for (const underlying of underlyingPolicies) {
    const underlyingLimit = getEffectiveLimit(underlying);

    if (underlyingLimit > umbrellaLimit) {
      const policyTypeName = formatPolicyType(underlying.policy_type);
      errors.push({
        field: 'underlying_policy_ids',
        message: `Umbrella limit (${formatCurrency(umbrellaLimit)}) must be >= underlying ${policyTypeName} limit (${formatCurrency(underlyingLimit)})`,
        underlyingPolicyType: underlying.policy_type,
        underlyingLimit,
        umbrellaLimit,
      });
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Calculate minimum required umbrella limit based on underlying policies
 *
 * @param underlyingPolicies - Array of policies that the umbrella will extend
 * @returns The minimum umbrella limit needed (max of all underlying limits)
 */
export function calculateMinimumUmbrellaLimit(
  underlyingPolicies: InsurancePolicy[]
): number {
  if (!underlyingPolicies || underlyingPolicies.length === 0) {
    return 0;
  }

  return Math.max(
    ...underlyingPolicies.map(p => getEffectiveLimit(p)),
    0
  );
}

/**
 * Get formatted list of underlying coverage types
 * Used for display: "Umbrella covers: GL, Auto, Workers Comp"
 *
 * @param underlyingPolicies - Array of underlying policies
 * @returns Formatted string like "GL, Auto, Workers Comp"
 */
export function formatUnderlyingCoverages(
  underlyingPolicies: InsurancePolicy[]
): string {
  if (!underlyingPolicies || underlyingPolicies.length === 0) {
    return '';
  }

  return underlyingPolicies
    .map(p => formatPolicyType(p.policy_type))
    .join(', ');
}
