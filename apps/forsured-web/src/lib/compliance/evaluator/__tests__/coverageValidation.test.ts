/**
 * REQ-128: Compliance Rule Evaluation Engine
 * Unit tests for coverage validation logic
 */

import { describe, it, expect } from 'vitest';
import {
  validateCoverageAmounts,
  checkMissingCoverageTypes,
  checkInsufficientLimits,
  compareCoverageLimits
} from '../coverageValidation';
import { CoverageType } from '../../types';
import { PolicyCoverage, GapType, DEFAULT_SCORE_DEDUCTIONS } from '../types';

describe('checkMissingCoverageTypes', () => {
  it('returns empty array when all required coverage types present', () => {
    const policyCoverages: PolicyCoverage[] = [
      {
        type: CoverageType.GENERAL_LIABILITY,
        per_occurrence_limit: 1000000,
        aggregate_limit: 2000000
      },
      {
        type: CoverageType.WORKERS_COMP,
        per_occurrence_limit: 1000000
      }
    ];

    const requiredTypes = [
      CoverageType.GENERAL_LIABILITY,
      CoverageType.WORKERS_COMP
    ];

    const gaps = checkMissingCoverageTypes(policyCoverages, requiredTypes);
    expect(gaps).toHaveLength(0);
  });

  it('identifies single missing coverage type', () => {
    const policyCoverages: PolicyCoverage[] = [
      {
        type: CoverageType.GENERAL_LIABILITY,
        per_occurrence_limit: 1000000,
        aggregate_limit: 2000000
      }
    ];

    const requiredTypes = [
      CoverageType.GENERAL_LIABILITY,
      CoverageType.WORKERS_COMP
    ];

    const gaps = checkMissingCoverageTypes(policyCoverages, requiredTypes);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].type).toBe(GapType.MISSING_COVERAGE);
    expect(gaps[0].coverage_type).toBe(CoverageType.WORKERS_COMP);
    expect(gaps[0].points_deducted).toBe(DEFAULT_SCORE_DEDUCTIONS.MISSING_COVERAGE);
  });

  it('identifies multiple missing coverage types', () => {
    const policyCoverages: PolicyCoverage[] = [
      {
        type: CoverageType.GENERAL_LIABILITY,
        per_occurrence_limit: 1000000,
        aggregate_limit: 2000000
      }
    ];

    const requiredTypes = [
      CoverageType.GENERAL_LIABILITY,
      CoverageType.WORKERS_COMP,
      CoverageType.AUTO_LIABILITY,
      CoverageType.UMBRELLA
    ];

    const gaps = checkMissingCoverageTypes(policyCoverages, requiredTypes);
    expect(gaps).toHaveLength(3);
    expect(gaps.every(g => g.type === GapType.MISSING_COVERAGE)).toBe(true);
  });

  it('handles empty policy coverage list', () => {
    const policyCoverages: PolicyCoverage[] = [];
    const requiredTypes = [
      CoverageType.GENERAL_LIABILITY,
      CoverageType.WORKERS_COMP
    ];

    const gaps = checkMissingCoverageTypes(policyCoverages, requiredTypes);
    expect(gaps).toHaveLength(2);
  });

  it('handles empty required types list', () => {
    const policyCoverages: PolicyCoverage[] = [
      {
        type: CoverageType.GENERAL_LIABILITY,
        per_occurrence_limit: 1000000,
        aggregate_limit: 2000000
      }
    ];

    const requiredTypes: CoverageType[] = [];

    const gaps = checkMissingCoverageTypes(policyCoverages, requiredTypes);
    expect(gaps).toHaveLength(0);
  });

  it('generates proper remediation message', () => {
    const policyCoverages: PolicyCoverage[] = [];
    const requiredTypes = [CoverageType.GENERAL_LIABILITY];

    const gaps = checkMissingCoverageTypes(policyCoverages, requiredTypes);
    expect(gaps[0].remediation).toContain('General Liability');
    expect(gaps[0].remediation).toContain('Add');
  });
});

describe('checkInsufficientLimits', () => {
  it('returns empty array when all limits sufficient', () => {
    const policyCoverage: PolicyCoverage = {
      type: CoverageType.GENERAL_LIABILITY,
      per_occurrence_limit: 1000000,
      aggregate_limit: 2000000
    };

    const requiredLimits = {
      per_occurrence: 1000000,
      aggregate: 2000000
    };

    const gaps = checkInsufficientLimits(
      policyCoverage,
      requiredLimits,
      CoverageType.GENERAL_LIABILITY
    );

    expect(gaps).toHaveLength(0);
  });

  it('identifies insufficient per-occurrence limit', () => {
    const policyCoverage: PolicyCoverage = {
      type: CoverageType.GENERAL_LIABILITY,
      per_occurrence_limit: 500000,
      aggregate_limit: 2000000
    };

    const requiredLimits = {
      per_occurrence: 1000000,
      aggregate: 2000000
    };

    const gaps = checkInsufficientLimits(
      policyCoverage,
      requiredLimits,
      CoverageType.GENERAL_LIABILITY
    );

    expect(gaps).toHaveLength(1);
    expect(gaps[0].type).toBe(GapType.INSUFFICIENT_AMOUNT);
    expect(gaps[0].current_value).toBe(500000);
    expect(gaps[0].required_value).toBe(1000000);
    expect(gaps[0].points_deducted).toBe(DEFAULT_SCORE_DEDUCTIONS.INSUFFICIENT_AMOUNT);
  });

  it('identifies insufficient aggregate limit', () => {
    const policyCoverage: PolicyCoverage = {
      type: CoverageType.GENERAL_LIABILITY,
      per_occurrence_limit: 1000000,
      aggregate_limit: 1000000
    };

    const requiredLimits = {
      per_occurrence: 1000000,
      aggregate: 2000000
    };

    const gaps = checkInsufficientLimits(
      policyCoverage,
      requiredLimits,
      CoverageType.GENERAL_LIABILITY
    );

    expect(gaps).toHaveLength(1);
    expect(gaps[0].type).toBe(GapType.INSUFFICIENT_AMOUNT);
    expect(gaps[0].current_value).toBe(1000000);
    expect(gaps[0].required_value).toBe(2000000);
  });

  it('identifies multiple insufficient limits', () => {
    const policyCoverage: PolicyCoverage = {
      type: CoverageType.GENERAL_LIABILITY,
      per_occurrence_limit: 500000,
      aggregate_limit: 1000000
    };

    const requiredLimits = {
      per_occurrence: 1000000,
      aggregate: 2000000
    };

    const gaps = checkInsufficientLimits(
      policyCoverage,
      requiredLimits,
      CoverageType.GENERAL_LIABILITY
    );

    expect(gaps).toHaveLength(2);
    expect(gaps.every(g => g.type === GapType.INSUFFICIENT_AMOUNT)).toBe(true);
  });

  it('handles exactly at limit (edge case)', () => {
    const policyCoverage: PolicyCoverage = {
      type: CoverageType.GENERAL_LIABILITY,
      per_occurrence_limit: 1000000,
      aggregate_limit: 2000000
    };

    const requiredLimits = {
      per_occurrence: 1000000,
      aggregate: 2000000
    };

    const gaps = checkInsufficientLimits(
      policyCoverage,
      requiredLimits,
      CoverageType.GENERAL_LIABILITY
    );

    expect(gaps).toHaveLength(0);
  });

  it('handles $1 below limit (edge case)', () => {
    const policyCoverage: PolicyCoverage = {
      type: CoverageType.GENERAL_LIABILITY,
      per_occurrence_limit: 999999,
      aggregate_limit: 2000000
    };

    const requiredLimits = {
      per_occurrence: 1000000,
      aggregate: 2000000
    };

    const gaps = checkInsufficientLimits(
      policyCoverage,
      requiredLimits,
      CoverageType.GENERAL_LIABILITY
    );

    expect(gaps).toHaveLength(1);
  });

  it('accepts exceeding requirements', () => {
    const policyCoverage: PolicyCoverage = {
      type: CoverageType.GENERAL_LIABILITY,
      per_occurrence_limit: 2000000,
      aggregate_limit: 4000000
    };

    const requiredLimits = {
      per_occurrence: 1000000,
      aggregate: 2000000
    };

    const gaps = checkInsufficientLimits(
      policyCoverage,
      requiredLimits,
      CoverageType.GENERAL_LIABILITY
    );

    expect(gaps).toHaveLength(0);
  });

  it('handles missing policy limits', () => {
    const policyCoverage: PolicyCoverage = {
      type: CoverageType.GENERAL_LIABILITY
      // No limits specified
    };

    const requiredLimits = {
      per_occurrence: 1000000,
      aggregate: 2000000
    };

    const gaps = checkInsufficientLimits(
      policyCoverage,
      requiredLimits,
      CoverageType.GENERAL_LIABILITY
    );

    expect(gaps.length).toBeGreaterThan(0);
  });

  it('generates proper remediation message with amounts', () => {
    const policyCoverage: PolicyCoverage = {
      type: CoverageType.GENERAL_LIABILITY,
      per_occurrence_limit: 500000,
      aggregate_limit: 2000000
    };

    const requiredLimits = {
      per_occurrence: 1000000,
      aggregate: 2000000
    };

    const gaps = checkInsufficientLimits(
      policyCoverage,
      requiredLimits,
      CoverageType.GENERAL_LIABILITY
    );

    expect(gaps[0].remediation).toContain('500,000');
    expect(gaps[0].remediation).toContain('1,000,000');
  });
});

describe('compareCoverageLimits', () => {
  it('returns true when actual equals required', () => {
    expect(compareCoverageLimits(1000000, 1000000)).toBe(true);
  });

  it('returns true when actual exceeds required', () => {
    expect(compareCoverageLimits(2000000, 1000000)).toBe(true);
  });

  it('returns false when actual is less than required', () => {
    expect(compareCoverageLimits(500000, 1000000)).toBe(false);
  });

  it('handles undefined actual value', () => {
    expect(compareCoverageLimits(undefined, 1000000)).toBe(false);
  });

  it('handles undefined required value', () => {
    expect(compareCoverageLimits(1000000, undefined)).toBe(true);
  });

  it('handles both undefined', () => {
    expect(compareCoverageLimits(undefined, undefined)).toBe(true);
  });

  it('handles zero values', () => {
    expect(compareCoverageLimits(0, 1000000)).toBe(false);
    expect(compareCoverageLimits(1000000, 0)).toBe(true);
  });
});

describe('validateCoverageAmounts', () => {
  it('validates all coverage types and amounts', () => {
    const policyCoverages: PolicyCoverage[] = [
      {
        type: CoverageType.GENERAL_LIABILITY,
        per_occurrence_limit: 1000000,
        aggregate_limit: 2000000
      },
      {
        type: CoverageType.WORKERS_COMP,
        per_occurrence_limit: 1000000
      }
    ];

    const requirements = new Map([
      [
        CoverageType.GENERAL_LIABILITY,
        {
          per_occurrence: 1000000,
          aggregate: 2000000
        }
      ],
      [
        CoverageType.WORKERS_COMP,
        {
          per_occurrence: 1000000
        }
      ]
    ]);

    const gaps = validateCoverageAmounts(policyCoverages, requirements);
    expect(gaps).toHaveLength(0);
  });

  it('combines missing coverage and insufficient limits gaps', () => {
    const policyCoverages: PolicyCoverage[] = [
      {
        type: CoverageType.GENERAL_LIABILITY,
        per_occurrence_limit: 500000,
        aggregate_limit: 2000000
      }
    ];

    const requirements = new Map([
      [
        CoverageType.GENERAL_LIABILITY,
        {
          per_occurrence: 1000000,
          aggregate: 2000000
        }
      ],
      [
        CoverageType.WORKERS_COMP,
        {
          per_occurrence: 1000000
        }
      ]
    ]);

    const gaps = validateCoverageAmounts(policyCoverages, requirements);

    // Should have 1 missing coverage + 1 insufficient limit
    expect(gaps.length).toBeGreaterThanOrEqual(2);

    const hasMissing = gaps.some(g => g.type === GapType.MISSING_COVERAGE);
    const hasInsufficient = gaps.some(g => g.type === GapType.INSUFFICIENT_AMOUNT);

    expect(hasMissing).toBe(true);
    expect(hasInsufficient).toBe(true);
  });
});
