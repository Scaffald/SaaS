/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Unit tests for date validation logic
 */

import { describe, it, expect } from 'vitest';
import {
  validatePolicyDates,
  checkPolicyExpired,
  checkPolicyExpiringSoon,
  checkPolicyEffectiveDate,
  parseDateString
} from '../dateValidation';
import { GapType, GRACE_PERIOD_DAYS } from '../types';

describe('parseDateString', () => {
  it('parses ISO date string', () => {
    const date = parseDateString('2024-01-15');
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0); // January (0-indexed)
    expect(date.getDate()).toBe(15);
  });

  it('handles timezone in ISO string', () => {
    const date = parseDateString('2024-01-15T10:30:00Z');
    expect(date.getFullYear()).toBe(2024);
  });
});

describe('checkPolicyExpired', () => {
  it('returns no gap for future expiration date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90); // 90 days in future

    const projectEndDate = new Date();
    projectEndDate.setDate(projectEndDate.getDate() + 60); // Project ends in 60 days

    const gap = checkPolicyExpired(
      futureDate.toISOString().split('T')[0],
      projectEndDate.toISOString().split('T')[0]
    );

    expect(gap).toBeNull();
  });

  it('identifies expired policy', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30); // 30 days ago

    const projectEndDate = new Date();
    projectEndDate.setDate(projectEndDate.getDate() + 60);

    const gap = checkPolicyExpired(
      pastDate.toISOString().split('T')[0],
      projectEndDate.toISOString().split('T')[0]
    );

    expect(gap).not.toBeNull();
    expect(gap!.type).toBe(GapType.EXPIRED_POLICY);
    expect(gap!.points_deducted).toBe(50);
  });

  it('identifies policy expiring before project end', () => {
    const policyExpiration = new Date();
    policyExpiration.setDate(policyExpiration.getDate() + 30); // Expires in 30 days

    const projectEndDate = new Date();
    projectEndDate.setDate(projectEndDate.getDate() + 60); // Project ends in 60 days

    const gap = checkPolicyExpired(
      policyExpiration.toISOString().split('T')[0],
      projectEndDate.toISOString().split('T')[0]
    );

    expect(gap).not.toBeNull();
    expect(gap!.type).toBe(GapType.EXPIRED_POLICY);
  });

  it('accepts policy expiring on project end date', () => {
    const date = new Date();
    date.setDate(date.getDate() + 60);

    const dateStr = date.toISOString().split('T')[0];

    const gap = checkPolicyExpired(dateStr, dateStr);

    expect(gap).toBeNull();
  });

  it('accepts policy expiring after project end date', () => {
    const policyExpiration = new Date();
    policyExpiration.setDate(policyExpiration.getDate() + 90);

    const projectEndDate = new Date();
    projectEndDate.setDate(projectEndDate.getDate() + 60);

    const gap = checkPolicyExpired(
      policyExpiration.toISOString().split('T')[0],
      projectEndDate.toISOString().split('T')[0]
    );

    expect(gap).toBeNull();
  });

  it('handles today as expiration date (edge case)', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureStr = futureDate.toISOString().split('T')[0];

    const gap = checkPolicyExpired(todayStr, futureStr);

    // Policy expires today but project continues, so it's expired
    expect(gap).not.toBeNull();
  });
});

describe('checkPolicyExpiringSoon', () => {
  it('returns no gap for policy expiring after grace period', () => {
    const farFutureDate = new Date();
    farFutureDate.setDate(farFutureDate.getDate() + GRACE_PERIOD_DAYS + 10);

    const gap = checkPolicyExpiringSoon(
      farFutureDate.toISOString().split('T')[0]
    );

    expect(gap).toBeNull();
  });

  it('identifies policy expiring within grace period', () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + GRACE_PERIOD_DAYS - 5); // Within grace period

    const gap = checkPolicyExpiringSoon(
      soonDate.toISOString().split('T')[0]
    );

    expect(gap).not.toBeNull();
    expect(gap!.type).toBe(GapType.EXPIRING_SOON);
    expect(gap!.points_deducted).toBe(5);
  });

  it('does not flag policy expiring on grace period boundary (30 days)', () => {
    const boundaryDate = new Date();
    boundaryDate.setDate(boundaryDate.getDate() + GRACE_PERIOD_DAYS);

    const gap = checkPolicyExpiringSoon(
      boundaryDate.toISOString().split('T')[0]
    );

    // 30 days is the cutoff - at exactly 30 days it should NOT be flagged
    expect(gap).toBeNull();
  });

  it('does not flag policy expiring at 31 days', () => {
    const justOutsideDate = new Date();
    justOutsideDate.setDate(justOutsideDate.getDate() + GRACE_PERIOD_DAYS + 1);

    const gap = checkPolicyExpiringSoon(
      justOutsideDate.toISOString().split('T')[0]
    );

    expect(gap).toBeNull();
  });

  it('identifies policy expiring in 15 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);

    const gap = checkPolicyExpiringSoon(
      soon.toISOString().split('T')[0]
    );

    expect(gap).not.toBeNull();
    expect(gap!.type).toBe(GapType.EXPIRING_SOON);
  });
});

describe('checkPolicyEffectiveDate', () => {
  it('accepts policy effective before project start', () => {
    const policyEffective = new Date();
    policyEffective.setDate(policyEffective.getDate() - 30); // 30 days ago

    const projectStart = new Date();
    projectStart.setDate(projectStart.getDate() + 10); // Starts in 10 days

    const gap = checkPolicyEffectiveDate(
      policyEffective.toISOString().split('T')[0],
      projectStart.toISOString().split('T')[0]
    );

    expect(gap).toBeNull();
  });

  it('accepts policy effective on project start date', () => {
    const date = new Date();
    date.setDate(date.getDate() + 10);
    const dateStr = date.toISOString().split('T')[0];

    const gap = checkPolicyEffectiveDate(dateStr, dateStr);

    expect(gap).toBeNull();
  });

  it('identifies policy effective after project start', () => {
    const policyEffective = new Date();
    policyEffective.setDate(policyEffective.getDate() + 30);

    const projectStart = new Date();
    projectStart.setDate(projectStart.getDate() + 10);

    const gap = checkPolicyEffectiveDate(
      policyEffective.toISOString().split('T')[0],
      projectStart.toISOString().split('T')[0]
    );

    expect(gap).not.toBeNull();
    expect(gap!.type).toBe(GapType.EXPIRED_POLICY);
  });

  it('handles project starting today', () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const policyEffective = new Date();
    policyEffective.setDate(policyEffective.getDate() - 10);
    const policyStr = policyEffective.toISOString().split('T')[0];

    const gap = checkPolicyEffectiveDate(policyStr, todayStr);

    expect(gap).toBeNull();
  });
});

describe('validatePolicyDates', () => {
  it('validates complete date range with no issues', () => {
    const policyEffective = new Date();
    policyEffective.setDate(policyEffective.getDate() - 30);

    const policyExpiration = new Date();
    policyExpiration.setDate(policyExpiration.getDate() + 90);

    const projectStart = new Date();
    projectStart.setDate(projectStart.getDate() + 10);

    const projectEnd = new Date();
    projectEnd.setDate(projectEnd.getDate() + 60);

    const gaps = validatePolicyDates(
      policyEffective.toISOString().split('T')[0],
      policyExpiration.toISOString().split('T')[0],
      projectStart.toISOString().split('T')[0],
      projectEnd.toISOString().split('T')[0]
    );

    expect(gaps).toHaveLength(0);
  });

  it('identifies multiple date issues', () => {
    const policyEffective = new Date();
    policyEffective.setDate(policyEffective.getDate() + 30); // Starts after project

    const policyExpiration = new Date();
    policyExpiration.setDate(policyExpiration.getDate() + 20); // Expires in 20 days

    const projectStart = new Date();
    projectStart.setDate(projectStart.getDate() + 10);

    const projectEnd = new Date();
    projectEnd.setDate(projectEnd.getDate() + 90); // Long project

    const gaps = validatePolicyDates(
      policyEffective.toISOString().split('T')[0],
      policyExpiration.toISOString().split('T')[0],
      projectStart.toISOString().split('T')[0],
      projectEnd.toISOString().split('T')[0]
    );

    // Should have: ineffective date issue, expired/expiring issues
    expect(gaps.length).toBeGreaterThan(0);
  });

  it('identifies expiring soon warning separately from expired', () => {
    const policyEffective = new Date();
    policyEffective.setDate(policyEffective.getDate() - 30);

    const policyExpiration = new Date();
    policyExpiration.setDate(policyExpiration.getDate() + 15); // Within grace period

    const projectStart = new Date();
    projectStart.setDate(projectStart.getDate() - 10); // Already started

    const projectEnd = new Date();
    projectEnd.setDate(projectEnd.getDate() + 10); // Ends soon

    const gaps = validatePolicyDates(
      policyEffective.toISOString().split('T')[0],
      policyExpiration.toISOString().split('T')[0],
      projectStart.toISOString().split('T')[0],
      projectEnd.toISOString().split('T')[0]
    );

    // Should identify expiring soon
    const hasExpiringSoon = gaps.some(g => g.type === GapType.EXPIRING_SOON);
    expect(hasExpiringSoon).toBe(true);
  });

  it('handles leap year dates', () => {
    const gaps = validatePolicyDates(
      '2028-02-29', // Leap year date (future)
      '2029-12-31',
      '2028-03-01',
      '2029-11-30'
    );

    expect(gaps).toHaveLength(0);
  });
});
