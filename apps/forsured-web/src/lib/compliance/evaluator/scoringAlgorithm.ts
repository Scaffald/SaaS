/**
 * Compliance Rule Evaluation Engine
 * Scoring algorithm implementation
 */

import {
  ComplianceGap,
  ComplianceStatus,
  DEFAULT_SCORE_BOUNDARIES
} from './types';

/**
 * Calculate compliance score based on gaps identified
 * Score starts at 100 and deductions are applied for each gap
 *
 * @param gaps Array of compliance gaps with point deductions
 * @returns Compliance score (0-100)
 */
export function calculateComplianceScore(gaps: ComplianceGap[]): number {
  // Start with perfect score
  let score = 100;

  // Apply deductions for each gap
  for (const gap of gaps) {
    score -= gap.points_deducted;
  }

  // Enforce floor at 0 (no negative scores)
  return Math.max(0, score);
}

/**
 * Determine compliance status based on score
 *
 * Boundaries:
 * - 90-100: Compliant (green)
 * - 70-89: Warning (yellow)
 * - 0-69: Critical (red)
 *
 * @param score Compliance score (0-100)
 * @returns Compliance status
 */
export function determineComplianceStatus(score: number): ComplianceStatus {
  if (score >= DEFAULT_SCORE_BOUNDARIES.COMPLIANT_MIN) {
    return ComplianceStatus.COMPLIANT;
  }

  if (score >= DEFAULT_SCORE_BOUNDARIES.WARNING_MIN) {
    return ComplianceStatus.WARNING;
  }

  return ComplianceStatus.CRITICAL;
}

/**
 * Validate score invariants
 * Ensures score meets all requirements:
 * - Within 0-100 range
 * - Is an integer
 *
 * @param score Score to validate
 * @returns True if score is valid
 */
export function validateScoreInvariants(score: number): boolean {
  // Must be a number
  if (typeof score !== 'number' || isNaN(score)) {
    return false;
  }

  // Must be within range
  if (score < 0 || score > 100) {
    return false;
  }

  // Must be an integer
  if (!Number.isInteger(score)) {
    return false;
  }

  return true;
}

/**
 * Calculate total points deducted
 * Useful for debugging and audit trails
 *
 * @param gaps Array of compliance gaps
 * @returns Total points deducted
 */
export function calculateTotalDeductions(gaps: ComplianceGap[]): number {
  return gaps.reduce((total, gap) => total + gap.points_deducted, 0);
}

/**
 * Group gaps by type for reporting
 *
 * @param gaps Array of compliance gaps
 * @returns Map of gap type to gaps
 */
export function groupGapsByType(gaps: ComplianceGap[]): Map<string, ComplianceGap[]> {
  const grouped = new Map<string, ComplianceGap[]>();

  for (const gap of gaps) {
    const key = gap.type;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(gap);
  }

  return grouped;
}

/**
 * Group gaps by severity for prioritization
 *
 * @param gaps Array of compliance gaps
 * @returns Map of severity to gaps
 */
export function groupGapsBySeverity(gaps: ComplianceGap[]): Map<string, ComplianceGap[]> {
  const grouped = new Map<string, ComplianceGap[]>();

  for (const gap of gaps) {
    const key = gap.severity;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(gap);
  }

  return grouped;
}
