/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Coverage validation logic
 */

import { v4 as uuidv4 } from 'uuid';
import { CoverageType, CoverageLimits } from '../types';
import {
  ComplianceGap,
  GapType,
  GapSeverity,
  PolicyCoverage,
  DEFAULT_SCORE_DEDUCTIONS
} from './types';

/**
 * Check for missing required coverage types
 *
 * @param policyCoverages List of coverages from policy
 * @param requiredTypes List of required coverage types
 * @returns Array of gaps for missing coverages
 */
export function checkMissingCoverageTypes(
  policyCoverages: PolicyCoverage[],
  requiredTypes: CoverageType[]
): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  // Get list of coverage types present in policy
  const presentTypes = new Set(policyCoverages.map(c => c.type));

  // Check each required type
  for (const requiredType of requiredTypes) {
    if (!presentTypes.has(requiredType)) {
      gaps.push({
        id: uuidv4(),
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: requiredType,
        required_value: formatCoverageTypeName(requiredType),
        remediation: `Add ${formatCoverageTypeName(requiredType)} coverage with required limits`,
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.MISSING_COVERAGE
      });
    }
  }

  return gaps;
}

/**
 * Check if coverage limits are insufficient
 *
 * @param policyCoverage Coverage from policy
 * @param requiredLimits Required limits
 * @param coverageType Coverage type being checked
 * @returns Array of gaps for insufficient limits
 */
export function checkInsufficientLimits(
  policyCoverage: PolicyCoverage,
  requiredLimits: CoverageLimits,
  coverageType: CoverageType | string
): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  // Check per-occurrence limit
  if (requiredLimits.per_occurrence !== undefined) {
    if (!compareCoverageLimits(
      policyCoverage.per_occurrence_limit,
      requiredLimits.per_occurrence
    )) {
      gaps.push({
        id: uuidv4(),
        type: GapType.INSUFFICIENT_AMOUNT,
        severity: GapSeverity.WARNING,
        coverage_type: coverageType,
        current_value: policyCoverage.per_occurrence_limit || 0,
        required_value: requiredLimits.per_occurrence,
        remediation: `Increase ${formatCoverageTypeName(coverageType)} per-occurrence limit from ${formatCurrency(policyCoverage.per_occurrence_limit)} to ${formatCurrency(requiredLimits.per_occurrence)}`,
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.INSUFFICIENT_AMOUNT
      });
    }
  }

  // Check aggregate limit
  if (requiredLimits.aggregate !== undefined) {
    if (!compareCoverageLimits(
      policyCoverage.aggregate_limit,
      requiredLimits.aggregate
    )) {
      gaps.push({
        id: uuidv4(),
        type: GapType.INSUFFICIENT_AMOUNT,
        severity: GapSeverity.WARNING,
        coverage_type: coverageType,
        current_value: policyCoverage.aggregate_limit || 0,
        required_value: requiredLimits.aggregate,
        remediation: `Increase ${formatCoverageTypeName(coverageType)} aggregate limit from ${formatCurrency(policyCoverage.aggregate_limit)} to ${formatCurrency(requiredLimits.aggregate)}`,
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.INSUFFICIENT_AMOUNT
      });
    }
  }

  // Check deductible max (if specified)
  if (requiredLimits.deductible_max !== undefined && policyCoverage.deductible !== undefined) {
    if (policyCoverage.deductible > requiredLimits.deductible_max) {
      gaps.push({
        id: uuidv4(),
        type: GapType.INSUFFICIENT_AMOUNT,
        severity: GapSeverity.WARNING,
        coverage_type: coverageType,
        current_value: policyCoverage.deductible,
        required_value: requiredLimits.deductible_max,
        remediation: `Reduce ${formatCoverageTypeName(coverageType)} deductible from ${formatCurrency(policyCoverage.deductible)} to maximum ${formatCurrency(requiredLimits.deductible_max)}`,
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.INSUFFICIENT_AMOUNT
      });
    }
  }

  return gaps;
}

/**
 * Compare actual vs required coverage limits
 *
 * @param actual Actual limit from policy
 * @param required Required limit
 * @returns True if actual meets or exceeds required
 */
export function compareCoverageLimits(
  actual: number | undefined,
  required: number | undefined
): boolean {
  // If no requirement specified, any value passes
  if (required === undefined) {
    return true;
  }

  // If requirement exists but no actual value, fails
  if (actual === undefined) {
    return false;
  }

  // Actual must meet or exceed required
  return actual >= required;
}

/**
 * Validate all coverage amounts against requirements
 *
 * @param policyCoverages List of coverages from policy
 * @param requirements Map of coverage type to required limits
 * @returns Array of all gaps found
 */
export function validateCoverageAmounts(
  policyCoverages: PolicyCoverage[],
  requirements: Map<CoverageType | string, CoverageLimits>
): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  // Check for missing coverage types
  const requiredTypes = Array.from(requirements.keys());
  const missingGaps = checkMissingCoverageTypes(
    policyCoverages,
    requiredTypes as CoverageType[]
  );
  gaps.push(...missingGaps);

  // Check limits for each present coverage
  for (const coverage of policyCoverages) {
    const requiredLimits = requirements.get(coverage.type);

    if (requiredLimits) {
      const limitGaps = checkInsufficientLimits(
        coverage,
        requiredLimits,
        coverage.type
      );
      gaps.push(...limitGaps);
    }
  }

  return gaps;
}

/**
 * Format coverage type name for display
 *
 * @param type Coverage type
 * @returns Formatted name
 */
function formatCoverageTypeName(type: CoverageType | string): string {
  if (typeof type !== 'string') {
    type = type.toString();
  }

  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format currency amount for display
 *
 * @param amount Amount in dollars
 * @returns Formatted currency string
 */
function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) {
    return '$0';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
