/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Date validation logic
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ComplianceGap,
  GapType,
  GapSeverity,
  DEFAULT_SCORE_DEDUCTIONS,
  GRACE_PERIOD_DAYS
} from './types';

/**
 * Parse date string to Date object
 * Handles ISO 8601 format (YYYY-MM-DD or full timestamp)
 * Always parses as local date to avoid timezone issues
 *
 * @param dateStr Date string
 * @returns Date object at midnight local time
 */
export function parseDateString(dateStr: string): Date {
  // If ISO date only (YYYY-MM-DD), parse as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Otherwise parse as ISO timestamp
  return new Date(dateStr);
}

/**
 * Check if policy has expired or will expire before project ends
 *
 * @param policyExpirationDate Policy expiration date
 * @param projectEndDate Project end date
 * @returns Gap if expired, null otherwise
 */
export function checkPolicyExpired(
  policyExpirationDate: string,
  projectEndDate: string
): ComplianceGap | null {
  const expirationDate = parseDateString(policyExpirationDate);
  const projectEnd = parseDateString(projectEndDate);
  const today = new Date();

  // Set to start of day for comparison
  today.setHours(0, 0, 0, 0);
  expirationDate.setHours(0, 0, 0, 0);
  projectEnd.setHours(0, 0, 0, 0);

  // Check if policy has already expired
  if (expirationDate < today) {
    return {
      id: uuidv4(),
      type: GapType.EXPIRED_POLICY,
      severity: GapSeverity.CRITICAL,
      current_value: policyExpirationDate,
      required_value: projectEndDate,
      remediation: `Policy expired on ${formatDate(policyExpirationDate)}. Provide renewed policy with expiration date after ${formatDate(projectEndDate)}`,
      points_deducted: DEFAULT_SCORE_DEDUCTIONS.EXPIRED_POLICY
    };
  }

  // Check if policy expires before project ends
  if (expirationDate < projectEnd) {
    return {
      id: uuidv4(),
      type: GapType.EXPIRED_POLICY,
      severity: GapSeverity.CRITICAL,
      current_value: policyExpirationDate,
      required_value: projectEndDate,
      remediation: `Policy expires on ${formatDate(policyExpirationDate)} before project ends on ${formatDate(projectEndDate)}. Provide policy coverage through project completion`,
      points_deducted: DEFAULT_SCORE_DEDUCTIONS.EXPIRED_POLICY
    };
  }

  return null;
}

/**
 * Check if policy is expiring soon (within grace period)
 * This is a warning, not a critical failure
 *
 * @param policyExpirationDate Policy expiration date
 * @returns Gap if expiring soon, null otherwise
 */
export function checkPolicyExpiringSoon(
  policyExpirationDate: string
): ComplianceGap | null {
  const expirationDate = parseDateString(policyExpirationDate);
  const today = new Date();
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  // Set to start of day for comparison
  today.setHours(0, 0, 0, 0);
  expirationDate.setHours(0, 0, 0, 0);
  gracePeriodEnd.setHours(0, 0, 0, 0);

  // Check if expiring within grace period (1 to GRACE_PERIOD_DAYS days)
  if (expirationDate > today && expirationDate < gracePeriodEnd) {
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: uuidv4(),
      type: GapType.EXPIRING_SOON,
      severity: GapSeverity.INFO,
      current_value: policyExpirationDate,
      required_value: `More than ${GRACE_PERIOD_DAYS} days`,
      remediation: `Policy expires in ${daysUntilExpiration} days on ${formatDate(policyExpirationDate)}. Consider requesting renewal documentation`,
      points_deducted: DEFAULT_SCORE_DEDUCTIONS.EXPIRING_SOON
    };
  }

  return null;
}

/**
 * Check if policy effective date is before project start
 *
 * @param policyEffectiveDate Policy effective date
 * @param projectStartDate Project start date
 * @returns Gap if ineffective, null otherwise
 */
export function checkPolicyEffectiveDate(
  policyEffectiveDate: string,
  projectStartDate: string
): ComplianceGap | null {
  const effectiveDate = parseDateString(policyEffectiveDate);
  const projectStart = parseDateString(projectStartDate);

  // Set to start of day for comparison
  effectiveDate.setHours(0, 0, 0, 0);
  projectStart.setHours(0, 0, 0, 0);

  // Policy must be effective on or before project start
  if (effectiveDate > projectStart) {
    return {
      id: uuidv4(),
      type: GapType.EXPIRED_POLICY,
      severity: GapSeverity.CRITICAL,
      current_value: policyEffectiveDate,
      required_value: projectStartDate,
      remediation: `Policy effective date ${formatDate(policyEffectiveDate)} is after project start date ${formatDate(projectStartDate)}. Provide policy effective before project begins`,
      points_deducted: DEFAULT_SCORE_DEDUCTIONS.EXPIRED_POLICY
    };
  }

  return null;
}

/**
 * Validate all policy dates against project timeline
 *
 * @param policyEffectiveDate Policy effective date
 * @param policyExpirationDate Policy expiration date
 * @param projectStartDate Project start date
 * @param projectEndDate Project end date
 * @returns Array of all date-related gaps
 */
export function validatePolicyDates(
  policyEffectiveDate: string,
  policyExpirationDate: string,
  projectStartDate: string,
  projectEndDate: string
): ComplianceGap[] {
  const gaps: ComplianceGap[] = [];

  // Check effective date
  const effectiveGap = checkPolicyEffectiveDate(
    policyEffectiveDate,
    projectStartDate
  );
  if (effectiveGap) {
    gaps.push(effectiveGap);
  }

  // Check expiration date
  const expiredGap = checkPolicyExpired(
    policyExpirationDate,
    projectEndDate
  );
  if (expiredGap) {
    gaps.push(expiredGap);
  }

  // Check if expiring soon (only if not already expired)
  if (!expiredGap) {
    const expiringSoonGap = checkPolicyExpiringSoon(policyExpirationDate);
    if (expiringSoonGap) {
      gaps.push(expiringSoonGap);
    }
  }

  return gaps;
}

/**
 * Format date string for display
 *
 * @param dateStr Date string
 * @returns Formatted date string
 */
function formatDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
