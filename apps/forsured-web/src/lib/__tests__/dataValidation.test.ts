/**
 * Data Validation Tests
 * Mock OCR & Document Parsing Engine for ACORD 25 Forms
 */

import { describe, it, expect } from 'vitest';
import {
  validateAndParseDate,
  validateAndParseCurrency,
  validatePolicyNumber,
  validateCoverageLimit,
  validateDateRange,
  checkMissingFields,
  getConfidenceCategory,
} from '../validation/dataValidation';

describe('validateAndParseDate', () => {
  it('should parse MM/DD/YYYY format correctly', () => {
    const result = validateAndParseDate('10/15/2024');
    expect(result.isValid).toBe(true);
    expect(result.isoDate).toBe('2024-10-15');
  });

  it('should parse YYYY-MM-DD format correctly', () => {
    const result = validateAndParseDate('2024-10-15');
    expect(result.isValid).toBe(true);
    expect(result.isoDate).toBe('2024-10-15');
  });

  it('should handle single digit month and day', () => {
    const result = validateAndParseDate('1/5/2024');
    expect(result.isValid).toBe(true);
    expect(result.isoDate).toBe('2024-01-05');
  });

  it('should reject invalid dates', () => {
    const result = validateAndParseDate('13/32/2024');
    expect(result.isValid).toBe(false);
    expect(result.isoDate).toBe(null);
  });

  it('should reject invalid formats', () => {
    const result = validateAndParseDate('invalid-date');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle null input', () => {
    const result = validateAndParseDate(null);
    expect(result.isValid).toBe(false);
    expect(result.isoDate).toBe(null);
  });
});

describe('validateAndParseCurrency', () => {
  it('should parse abbreviated format $1M', () => {
    const result = validateAndParseCurrency('$1M');
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(1000000);
  });

  it('should parse abbreviated format $2.5M', () => {
    const result = validateAndParseCurrency('$2.5M');
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(2500000);
  });

  it('should parse numeric format $1,000,000', () => {
    const result = validateAndParseCurrency('$1,000,000');
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(1000000);
  });

  it('should parse numeric format without dollar sign', () => {
    const result = validateAndParseCurrency('1000000');
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(1000000);
  });

  it('should parse written format "One Million Dollars"', () => {
    const result = validateAndParseCurrency('One Million Dollars');
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(1000000);
  });

  it('should parse "5 Million" case insensitive', () => {
    const result = validateAndParseCurrency('5 million');
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(5000000);
  });

  it('should reject invalid currency format', () => {
    const result = validateAndParseCurrency('invalid-amount');
    expect(result.isValid).toBe(false);
    expect(result.amount).toBe(null);
  });

  it('should handle null input', () => {
    const result = validateAndParseCurrency(null);
    expect(result.isValid).toBe(false);
    expect(result.amount).toBe(null);
  });
});

describe('validatePolicyNumber', () => {
  it('should validate standard format XX-XXXX-XXXXXXXX', () => {
    const result = validatePolicyNumber('GL-TRV-20241015');
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe('GL-TRV-20241015');
  });

  it('should validate with numbers in middle section', () => {
    const result = validatePolicyNumber('LM-GL5789-20240101');
    expect(result.isValid).toBe(true);
  });

  it('should normalize to uppercase', () => {
    const result = validatePolicyNumber('gl-trv-20241015');
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBe('GL-TRV-20241015');
  });

  it('should handle format without dashes', () => {
    const result = validatePolicyNumber('GLTRV20241015');
    expect(result.isValid).toBe(true);
    expect(result.normalized).toBeDefined();
  });

  it('should reject too short policy numbers', () => {
    const result = validatePolicyNumber('GL-123');
    expect(result.isValid).toBe(false);
  });

  it('should handle null input', () => {
    const result = validatePolicyNumber(null);
    expect(result.isValid).toBe(false);
    expect(result.normalized).toBe(null);
  });
});

describe('validateCoverageLimit', () => {
  it('should pass for reasonable coverage amounts', () => {
    const result = validateCoverageLimit(1000000, 'general_liability');
    expect(result.isValid).toBe(true);
    expect(result.warning).toBeUndefined();
  });

  it('should warn for unusually low coverage', () => {
    const result = validateCoverageLimit(50000, 'general_liability');
    expect(result.isValid).toBe(true);
    expect(result.warning).toContain('unusually low');
  });

  it('should warn for unusually high coverage', () => {
    const result = validateCoverageLimit(150000000, 'general_liability');
    expect(result.isValid).toBe(true);
    expect(result.warning).toContain('unusually high');
  });

  it('should handle null amount', () => {
    const result = validateCoverageLimit(null, 'general_liability');
    expect(result.isValid).toBe(false);
  });
});

describe('validateDateRange', () => {
  it('should pass for valid date range', () => {
    const result = validateDateRange('2024-01-01', '2024-12-31');
    expect(result.isValid).toBe(true);
  });

  it('should fail if effective date is after expiration', () => {
    const result = validateDateRange('2024-12-31', '2024-01-01');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('before');
  });

  it('should fail if effective date equals expiration', () => {
    const result = validateDateRange('2024-01-01', '2024-01-01');
    expect(result.isValid).toBe(false);
  });

  it('should handle null dates', () => {
    const result = validateDateRange(null, '2024-12-31');
    expect(result.isValid).toBe(false);
  });

  it('should warn about dates outside reasonable range', () => {
    const result = validateDateRange('2010-01-01', '2010-12-31');
    expect(result.isValid).toBe(true);
    expect(result.error).toContain('outside reasonable range');
  });
});

describe('checkMissingFields', () => {
  it('should return no errors for complete extraction', () => {
    const extraction = {
      policy_number: 'GL-TRV-20241015',
      carrier: 'Travelers',
      effective_date: '2024-01-01',
      expiration_date: '2024-12-31',
      coverage_types: [{ type: 'general_liability', amount: 1000000 }],
    };

    const errors = checkMissingFields(extraction);
    expect(errors).toHaveLength(0);
  });

  it('should detect missing policy number', () => {
    const extraction = {
      policy_number: null,
      carrier: 'Travelers',
      effective_date: '2024-01-01',
      expiration_date: '2024-12-31',
      coverage_types: [{ type: 'general_liability', amount: 1000000 }],
    };

    const errors = checkMissingFields(extraction);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('policy_number');
  });

  it('should detect unknown carrier', () => {
    const extraction = {
      policy_number: 'GL-123',
      carrier: 'Unknown',
      effective_date: '2024-01-01',
      expiration_date: '2024-12-31',
      coverage_types: [{ type: 'general_liability', amount: 1000000 }],
    };

    const errors = checkMissingFields(extraction);
    expect(errors.some(e => e.field === 'carrier')).toBe(true);
  });

  it('should detect missing dates', () => {
    const extraction = {
      policy_number: 'GL-123',
      carrier: 'Travelers',
      effective_date: null,
      expiration_date: null,
      coverage_types: [{ type: 'general_liability', amount: 1000000 }],
    };

    const errors = checkMissingFields(extraction);
    expect(errors.some(e => e.field === 'effective_date')).toBe(true);
    expect(errors.some(e => e.field === 'expiration_date')).toBe(true);
  });

  it('should detect missing coverage types', () => {
    const extraction = {
      policy_number: 'GL-123',
      carrier: 'Travelers',
      effective_date: '2024-01-01',
      expiration_date: '2024-12-31',
      coverage_types: [],
    };

    const errors = checkMissingFields(extraction);
    expect(errors.some(e => e.field === 'coverage_types')).toBe(true);
  });
});

describe('getConfidenceCategory', () => {
  it('should return "high" for >= 80%', () => {
    expect(getConfidenceCategory(80)).toBe('high');
    expect(getConfidenceCategory(95)).toBe('high');
    expect(getConfidenceCategory(100)).toBe('high');
  });

  it('should return "medium" for 50-79%', () => {
    expect(getConfidenceCategory(50)).toBe('medium');
    expect(getConfidenceCategory(65)).toBe('medium');
    expect(getConfidenceCategory(79)).toBe('medium');
  });

  it('should return "low" for < 50%', () => {
    expect(getConfidenceCategory(0)).toBe('low');
    expect(getConfidenceCategory(25)).toBe('low');
    expect(getConfidenceCategory(49)).toBe('low');
  });
});
