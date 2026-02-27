/**
 * Compliance Rule Evaluation Engine
 * Unit tests for scoring algorithm
 * Following TDD principles
 */

import { describe, it, expect } from 'vitest';
import {
  calculateComplianceScore,
  determineComplianceStatus,
  validateScoreInvariants
} from '../scoringAlgorithm';
import {
  ComplianceGap,
  GapType,
  GapSeverity,
  ComplianceStatus,
  DEFAULT_SCORE_DEDUCTIONS
} from '../types';

describe('calculateComplianceScore', () => {
  describe('Full Compliance Scenarios', () => {
    it('returns 100 for zero gaps', () => {
      const score = calculateComplianceScore([]);
      expect(score).toBe(100);
    });

    it('returns 100 for empty gaps array', () => {
      const score = calculateComplianceScore([]);
      expect(score).toBe(100);
    });
  });

  describe('Single Deduction Scenarios', () => {
    it('deducts 20 points for missing coverage', () => {
      const gaps: ComplianceGap[] = [{
        id: 'gap-1',
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        coverage_type: 'general_liability',
        required_value: 1000000,
        remediation: 'Add General Liability coverage',
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.MISSING_COVERAGE
      }];

      const score = calculateComplianceScore(gaps);
      expect(score).toBe(80); // 100 - 20
    });

    it('deducts 10 points for insufficient amount', () => {
      const gaps: ComplianceGap[] = [{
        id: 'gap-2',
        type: GapType.INSUFFICIENT_AMOUNT,
        severity: GapSeverity.WARNING,
        coverage_type: 'general_liability',
        current_value: 500000,
        required_value: 1000000,
        remediation: 'Increase coverage',
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.INSUFFICIENT_AMOUNT
      }];

      const score = calculateComplianceScore(gaps);
      expect(score).toBe(90); // 100 - 10
    });

    it('deducts 15 points for missing endorsement', () => {
      const gaps: ComplianceGap[] = [{
        id: 'gap-3',
        type: GapType.MISSING_ENDORSEMENT,
        severity: GapSeverity.WARNING,
        endorsement: 'additional_insured',
        required_value: 'additional_insured',
        remediation: 'Obtain Additional Insured endorsement',
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.MISSING_ENDORSEMENT
      }];

      const score = calculateComplianceScore(gaps);
      expect(score).toBe(85); // 100 - 15
    });

    it('deducts 50 points for expired policy', () => {
      const gaps: ComplianceGap[] = [{
        id: 'gap-4',
        type: GapType.EXPIRED_POLICY,
        severity: GapSeverity.CRITICAL,
        current_value: '2023-12-31',
        required_value: '2024-12-31',
        remediation: 'Provide renewed policy',
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.EXPIRED_POLICY
      }];

      const score = calculateComplianceScore(gaps);
      expect(score).toBe(50); // 100 - 50
    });

    it('deducts 10 points for incorrect certificate holder', () => {
      const gaps: ComplianceGap[] = [{
        id: 'gap-5',
        type: GapType.INCORRECT_HOLDER,
        severity: GapSeverity.WARNING,
        current_value: 'Wrong Company',
        required_value: 'Correct Company',
        remediation: 'Update certificate holder',
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.INCORRECT_HOLDER
      }];

      const score = calculateComplianceScore(gaps);
      expect(score).toBe(90); // 100 - 10
    });

    it('deducts 5 points for expiring soon', () => {
      const gaps: ComplianceGap[] = [{
        id: 'gap-6',
        type: GapType.EXPIRING_SOON,
        severity: GapSeverity.INFO,
        current_value: '2024-01-15',
        required_value: '2024-12-31',
        remediation: 'Policy expires within 30 days',
        points_deducted: DEFAULT_SCORE_DEDUCTIONS.EXPIRING_SOON
      }];

      const score = calculateComplianceScore(gaps);
      expect(score).toBe(95); // 100 - 5
    });
  });

  describe('Multiple Deductions Combined', () => {
    it('correctly combines two different gap types', () => {
      const gaps: ComplianceGap[] = [
        {
          id: 'gap-1',
          type: GapType.MISSING_COVERAGE,
          severity: GapSeverity.CRITICAL,
          required_value: 1000000,
          remediation: 'Add coverage',
          points_deducted: 20
        },
        {
          id: 'gap-2',
          type: GapType.MISSING_ENDORSEMENT,
          severity: GapSeverity.WARNING,
          required_value: 'additional_insured',
          remediation: 'Add endorsement',
          points_deducted: 15
        }
      ];

      const score = calculateComplianceScore(gaps);
      expect(score).toBe(65); // 100 - 20 - 15
    });

    it('correctly combines multiple gaps totaling more than 100 points', () => {
      const gaps: ComplianceGap[] = [
        {
          id: 'gap-1',
          type: GapType.EXPIRED_POLICY,
          severity: GapSeverity.CRITICAL,
          required_value: '2024-12-31',
          remediation: 'Renew policy',
          points_deducted: 50
        },
        {
          id: 'gap-2',
          type: GapType.MISSING_COVERAGE,
          severity: GapSeverity.CRITICAL,
          required_value: 1000000,
          remediation: 'Add coverage',
          points_deducted: 20
        },
        {
          id: 'gap-3',
          type: GapType.MISSING_COVERAGE,
          severity: GapSeverity.CRITICAL,
          required_value: 1000000,
          remediation: 'Add coverage',
          points_deducted: 20
        },
        {
          id: 'gap-4',
          type: GapType.MISSING_ENDORSEMENT,
          severity: GapSeverity.WARNING,
          required_value: 'waiver_of_subrogation',
          remediation: 'Add endorsement',
          points_deducted: 15
        }
      ];

      const score = calculateComplianceScore(gaps);
      expect(score).toBe(0); // Score cannot go negative
    });
  });

  describe('Score Floor at 0', () => {
    it('never returns negative score', () => {
      const gaps: ComplianceGap[] = Array.from({ length: 10 }, (_, i) => ({
        id: `gap-${i}`,
        type: GapType.MISSING_COVERAGE,
        severity: GapSeverity.CRITICAL,
        required_value: 1000000,
        remediation: 'Add coverage',
        points_deducted: 20
      }));

      const score = calculateComplianceScore(gaps);
      expect(score).toBe(0);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Deterministic Scoring', () => {
    it('returns same score for same gaps (different order)', () => {
      const gaps1: ComplianceGap[] = [
        {
          id: 'gap-1',
          type: GapType.MISSING_COVERAGE,
          severity: GapSeverity.CRITICAL,
          required_value: 1000000,
          remediation: 'Add coverage',
          points_deducted: 20
        },
        {
          id: 'gap-2',
          type: GapType.MISSING_ENDORSEMENT,
          severity: GapSeverity.WARNING,
          required_value: 'additional_insured',
          remediation: 'Add endorsement',
          points_deducted: 15
        }
      ];

      const gaps2: ComplianceGap[] = [
        {
          id: 'gap-2',
          type: GapType.MISSING_ENDORSEMENT,
          severity: GapSeverity.WARNING,
          required_value: 'additional_insured',
          remediation: 'Add endorsement',
          points_deducted: 15
        },
        {
          id: 'gap-1',
          type: GapType.MISSING_COVERAGE,
          severity: GapSeverity.CRITICAL,
          required_value: 1000000,
          remediation: 'Add coverage',
          points_deducted: 20
        }
      ];

      const score1 = calculateComplianceScore(gaps1);
      const score2 = calculateComplianceScore(gaps2);

      expect(score1).toBe(score2);
      expect(score1).toBe(65);
    });

    it('returns same score on multiple calculations', () => {
      const gaps: ComplianceGap[] = [{
        id: 'gap-1',
        type: GapType.INSUFFICIENT_AMOUNT,
        severity: GapSeverity.WARNING,
        current_value: 500000,
        required_value: 1000000,
        remediation: 'Increase coverage',
        points_deducted: 10
      }];

      const scores = Array.from({ length: 5 }, () => calculateComplianceScore(gaps));

      expect(new Set(scores).size).toBe(1); // All scores are identical
      expect(scores[0]).toBe(90);
    });
  });
});

describe('determineComplianceStatus', () => {
  it('returns COMPLIANT for score 90-100', () => {
    expect(determineComplianceStatus(100)).toBe(ComplianceStatus.COMPLIANT);
    expect(determineComplianceStatus(95)).toBe(ComplianceStatus.COMPLIANT);
    expect(determineComplianceStatus(90)).toBe(ComplianceStatus.COMPLIANT);
  });

  it('returns WARNING for score 70-89', () => {
    expect(determineComplianceStatus(89)).toBe(ComplianceStatus.WARNING);
    expect(determineComplianceStatus(80)).toBe(ComplianceStatus.WARNING);
    expect(determineComplianceStatus(70)).toBe(ComplianceStatus.WARNING);
  });

  it('returns CRITICAL for score 0-69', () => {
    expect(determineComplianceStatus(69)).toBe(ComplianceStatus.CRITICAL);
    expect(determineComplianceStatus(50)).toBe(ComplianceStatus.CRITICAL);
    expect(determineComplianceStatus(0)).toBe(ComplianceStatus.CRITICAL);
  });
});

describe('validateScoreInvariants', () => {
  it('validates score is within 0-100 range', () => {
    expect(validateScoreInvariants(0)).toBe(true);
    expect(validateScoreInvariants(50)).toBe(true);
    expect(validateScoreInvariants(100)).toBe(true);
  });

  it('rejects scores below 0', () => {
    expect(validateScoreInvariants(-1)).toBe(false);
    expect(validateScoreInvariants(-100)).toBe(false);
  });

  it('rejects scores above 100', () => {
    expect(validateScoreInvariants(101)).toBe(false);
    expect(validateScoreInvariants(200)).toBe(false);
  });

  it('rejects non-integer scores', () => {
    expect(validateScoreInvariants(50.5)).toBe(false);
    expect(validateScoreInvariants(99.9)).toBe(false);
  });
});
