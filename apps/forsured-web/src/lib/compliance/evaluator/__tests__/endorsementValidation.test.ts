/**
 * Compliance Rule Evaluation Engine
 * Unit tests for endorsement verification logic
 */

import { describe, it, expect } from 'vitest';
import {
  validateEndorsements,
  checkMissingEndorsements,
  normalizeEndorsementName,
  matchEndorsementFuzzy
} from '../endorsementValidation';
import { GapType, DEFAULT_SCORE_DEDUCTIONS } from '../types';

describe('normalizeEndorsementName', () => {
  it('converts to lowercase', () => {
    expect(normalizeEndorsementName('ADDITIONAL INSURED')).toBe('additional insured');
  });

  it('removes extra whitespace', () => {
    expect(normalizeEndorsementName('Additional  Insured')).toBe('additional insured');
  });

  it('trims leading/trailing whitespace', () => {
    expect(normalizeEndorsementName('  Additional Insured  ')).toBe('additional insured');
  });

  it('handles empty string', () => {
    expect(normalizeEndorsementName('')).toBe('');
  });
});

describe('matchEndorsementFuzzy', () => {
  describe('Exact matches', () => {
    it('matches exact endorsement name', () => {
      expect(matchEndorsementFuzzy('additional_insured', ['additional_insured'])).toBe(true);
    });

    it('matches with different casing', () => {
      expect(matchEndorsementFuzzy('ADDITIONAL_INSURED', ['additional_insured'])).toBe(true);
    });
  });

  describe('Common abbreviations', () => {
    it('matches "AI" to "additional_insured"', () => {
      expect(matchEndorsementFuzzy('additional_insured', ['AI'])).toBe(true);
      expect(matchEndorsementFuzzy('additional_insured', ['ai'])).toBe(true);
    });

    it('matches "WOS" to "waiver_of_subrogation"', () => {
      expect(matchEndorsementFuzzy('waiver_of_subrogation', ['WOS'])).toBe(true);
      expect(matchEndorsementFuzzy('waiver_of_subrogation', ['wos'])).toBe(true);
    });

    it('matches "P&NC" to "primary_non_contributory"', () => {
      expect(matchEndorsementFuzzy('primary_non_contributory', ['P&NC'])).toBe(true);
      expect(matchEndorsementFuzzy('primary_non_contributory', ['p&nc'])).toBe(true);
    });

    it('matches "30DNC" to "30_day_notice_cancellation"', () => {
      expect(matchEndorsementFuzzy('30_day_notice_cancellation', ['30DNC'])).toBe(true);
      expect(matchEndorsementFuzzy('30_day_notice_cancellation', ['30dnc'])).toBe(true);
    });
  });

  describe('Keyword matching', () => {
    it('matches "additional" keyword', () => {
      expect(matchEndorsementFuzzy('additional_insured', ['Additional Insured Status'])).toBe(true);
    });

    it('matches "waiver" and "subrogation" keywords', () => {
      expect(matchEndorsementFuzzy('waiver_of_subrogation', ['Waiver of Subrogation Rights'])).toBe(true);
    });

    it('matches "primary" and "non-contributory" keywords', () => {
      expect(matchEndorsementFuzzy('primary_non_contributory', ['Primary and Non-Contributory Coverage'])).toBe(true);
    });

    it('matches "30 day" and "notice" keywords', () => {
      expect(matchEndorsementFuzzy('30_day_notice_cancellation', ['30 Day Notice of Cancellation'])).toBe(true);
    });
  });

  describe('Partial matches', () => {
    it('matches variations of additional insured', () => {
      expect(matchEndorsementFuzzy('additional_insured', ['Additional Insured - General'])).toBe(true);
      expect(matchEndorsementFuzzy('additional_insured', ['Add\'l Insured'])).toBe(true);
    });

    it('matches variations of waiver of subrogation', () => {
      expect(matchEndorsementFuzzy('waiver_of_subrogation', ['Waiver of Sub'])).toBe(true);
      expect(matchEndorsementFuzzy('waiver_of_subrogation', ['Subrogation Waiver'])).toBe(true);
    });
  });

  describe('Non-matches', () => {
    it('does not match unrelated endorsement', () => {
      expect(matchEndorsementFuzzy('additional_insured', ['Professional Liability'])).toBe(false);
    });

    it('does not match empty list', () => {
      expect(matchEndorsementFuzzy('additional_insured', [])).toBe(false);
    });

    it('does not match when no keywords present', () => {
      expect(matchEndorsementFuzzy('additional_insured', ['Some Random Text'])).toBe(false);
    });
  });
});

describe('checkMissingEndorsements', () => {
  it('returns empty array when all endorsements present', () => {
    const policyEndorsements = [
      'additional_insured',
      'waiver_of_subrogation',
      'primary_non_contributory'
    ];

    const requiredEndorsements = [
      {
        endorsement_type: 'additional_insured',
        description: 'Additional Insured'
      },
      {
        endorsement_type: 'waiver_of_subrogation',
        description: 'Waiver of Subrogation'
      },
      {
        endorsement_type: 'primary_non_contributory',
        description: 'Primary and Non-Contributory'
      }
    ];

    const gaps = checkMissingEndorsements(policyEndorsements, requiredEndorsements);
    expect(gaps).toHaveLength(0);
  });

  it('identifies single missing endorsement', () => {
    const policyEndorsements = [
      'additional_insured',
      'waiver_of_subrogation'
    ];

    const requiredEndorsements = [
      {
        endorsement_type: 'additional_insured',
        description: 'Additional Insured'
      },
      {
        endorsement_type: 'waiver_of_subrogation',
        description: 'Waiver of Subrogation'
      },
      {
        endorsement_type: 'primary_non_contributory',
        description: 'Primary and Non-Contributory'
      }
    ];

    const gaps = checkMissingEndorsements(policyEndorsements, requiredEndorsements);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].type).toBe(GapType.MISSING_ENDORSEMENT);
    expect(gaps[0].endorsement).toBe('primary_non_contributory');
    expect(gaps[0].points_deducted).toBe(DEFAULT_SCORE_DEDUCTIONS.MISSING_ENDORSEMENT);
  });

  it('identifies multiple missing endorsements', () => {
    const policyEndorsements = [
      'additional_insured'
    ];

    const requiredEndorsements = [
      {
        endorsement_type: 'additional_insured',
        description: 'Additional Insured'
      },
      {
        endorsement_type: 'waiver_of_subrogation',
        description: 'Waiver of Subrogation'
      },
      {
        endorsement_type: 'primary_non_contributory',
        description: 'Primary and Non-Contributory'
      },
      {
        endorsement_type: '30_day_notice_cancellation',
        description: '30-Day Notice of Cancellation'
      }
    ];

    const gaps = checkMissingEndorsements(policyEndorsements, requiredEndorsements);

    expect(gaps).toHaveLength(3);
    expect(gaps.every(g => g.type === GapType.MISSING_ENDORSEMENT)).toBe(true);
  });

  it('handles empty policy endorsements', () => {
    const policyEndorsements: string[] = [];

    const requiredEndorsements = [
      {
        endorsement_type: 'additional_insured',
        description: 'Additional Insured'
      }
    ];

    const gaps = checkMissingEndorsements(policyEndorsements, requiredEndorsements);

    expect(gaps).toHaveLength(1);
  });

  it('handles empty required endorsements', () => {
    const policyEndorsements = ['additional_insured'];
    const requiredEndorsements: Array<{ endorsement_type: string; description: string }> = [];

    const gaps = checkMissingEndorsements(policyEndorsements, requiredEndorsements);

    expect(gaps).toHaveLength(0);
  });

  it('matches with abbreviations', () => {
    const policyEndorsements = [
      'AI',  // Additional Insured abbreviation
      'WOS', // Waiver of Subrogation abbreviation
      'P&NC' // Primary & Non-Contributory abbreviation
    ];

    const requiredEndorsements = [
      {
        endorsement_type: 'additional_insured',
        description: 'Additional Insured'
      },
      {
        endorsement_type: 'waiver_of_subrogation',
        description: 'Waiver of Subrogation'
      },
      {
        endorsement_type: 'primary_non_contributory',
        description: 'Primary and Non-Contributory'
      }
    ];

    const gaps = checkMissingEndorsements(policyEndorsements, requiredEndorsements);

    expect(gaps).toHaveLength(0);
  });

  it('matches with partial text', () => {
    const policyEndorsements = [
      'Additional Insured - General Contractors',
      'Waiver of Sub',
      'Primary and Non-Contributory Coverage'
    ];

    const requiredEndorsements = [
      {
        endorsement_type: 'additional_insured',
        description: 'Additional Insured'
      },
      {
        endorsement_type: 'waiver_of_subrogation',
        description: 'Waiver of Subrogation'
      },
      {
        endorsement_type: 'primary_non_contributory',
        description: 'Primary and Non-Contributory'
      }
    ];

    const gaps = checkMissingEndorsements(policyEndorsements, requiredEndorsements);

    expect(gaps).toHaveLength(0);
  });

  it('does not match unrelated endorsements', () => {
    const policyEndorsements = [
      'Professional Liability',
      'Equipment Coverage'
    ];

    const requiredEndorsements = [
      {
        endorsement_type: 'additional_insured',
        description: 'Additional Insured'
      }
    ];

    const gaps = checkMissingEndorsements(policyEndorsements, requiredEndorsements);

    expect(gaps).toHaveLength(1);
  });

  it('generates proper remediation message', () => {
    const policyEndorsements: string[] = [];

    const requiredEndorsements = [
      {
        endorsement_type: 'additional_insured',
        description: 'Additional Insured'
      }
    ];

    const gaps = checkMissingEndorsements(policyEndorsements, requiredEndorsements);

    expect(gaps[0].remediation).toContain('Additional Insured');
    expect(gaps[0].remediation).toContain('endorsement');
  });
});

describe('validateEndorsements', () => {
  it('validates all endorsements successfully', () => {
    const policyEndorsements = [
      'additional_insured',
      'waiver_of_subrogation',
      'primary_non_contributory',
      '30_day_notice_cancellation'
    ];

    const requiredEndorsements = [
      {
        endorsement_type: 'additional_insured',
        description: 'Additional Insured'
      },
      {
        endorsement_type: 'waiver_of_subrogation',
        description: 'Waiver of Subrogation'
      },
      {
        endorsement_type: 'primary_non_contributory',
        description: 'Primary and Non-Contributory'
      },
      {
        endorsement_type: '30_day_notice_cancellation',
        description: '30-Day Notice of Cancellation'
      }
    ];

    const gaps = validateEndorsements(policyEndorsements, requiredEndorsements);

    expect(gaps).toHaveLength(0);
  });

  it('allows extra endorsements without penalty', () => {
    const policyEndorsements = [
      'additional_insured',
      'waiver_of_subrogation',
      'extra_endorsement_1',
      'extra_endorsement_2'
    ];

    const requiredEndorsements = [
      {
        endorsement_type: 'additional_insured',
        description: 'Additional Insured'
      },
      {
        endorsement_type: 'waiver_of_subrogation',
        description: 'Waiver of Subrogation'
      }
    ];

    const gaps = validateEndorsements(policyEndorsements, requiredEndorsements);

    expect(gaps).toHaveLength(0);
  });
});
