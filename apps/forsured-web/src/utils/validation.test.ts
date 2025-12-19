/**
 * Tests for validation utilities (REQ-167)
 * TDD: Write tests first
 */

import { describe, it, expect } from 'vitest';
import {
  validatePolicyNumber,
  validateDate,
  validateDateRange,
  validateCoverageLimit,
  validateCarrier,
  validateAllFields,
  type FieldValidators,
} from './validation';
import { createOCRField } from '../types/ocr.types';

describe('validatePolicyNumber', () => {
  it('should accept valid alphanumeric policy numbers', () => {
    expect(validatePolicyNumber('ABC123')).toBeNull();
    expect(validatePolicyNumber('POL-12345-ABC')).toBeNull();
    expect(validatePolicyNumber('12345ABCDE')).toBeNull();
  });

  it('should reject empty or missing policy numbers', () => {
    const error = validatePolicyNumber('');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('required');
    expect(error?.severity).toBe('error');
  });

  it('should reject policy numbers shorter than 5 characters', () => {
    const error = validatePolicyNumber('AB12');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('5-50 characters');
  });

  it('should reject policy numbers longer than 50 characters', () => {
    const error = validatePolicyNumber('A'.repeat(51));
    expect(error).not.toBeNull();
    expect(error?.message).toContain('5-50 characters');
  });

  it('should reject policy numbers with special characters', () => {
    const error = validatePolicyNumber('ABC@123');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('alphanumeric');
  });
});

describe('validateDate', () => {
  it('should accept valid ISO date strings', () => {
    expect(validateDate('2024-01-15', 'Effective Date')).toBeNull();
    expect(validateDate('2025-12-31', 'Expiration Date')).toBeNull();
  });

  it('should reject invalid date formats', () => {
    const error = validateDate('invalid-date', 'Test Date');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('valid date');
  });

  it('should reject dates more than 10 years in the past', () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 11);
    const error = validateDate(oldDate.toISOString().split('T')[0], 'Test Date');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('10 years');
  });

  it('should reject dates more than 10 years in the future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 11);
    const error = validateDate(futureDate.toISOString().split('T')[0], 'Test Date');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('10 years');
  });
});

describe('validateDateRange', () => {
  it('should accept valid date ranges where effective is before expiration', () => {
    expect(validateDateRange('2024-01-01', '2024-12-31')).toBeNull();
  });

  it('should reject ranges where effective date is after expiration date', () => {
    const error = validateDateRange('2024-12-31', '2024-01-01');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('before');
  });

  it('should reject ranges where dates are equal', () => {
    const error = validateDateRange('2024-06-15', '2024-06-15');
    expect(error).not.toBeNull();
    expect(error?.message).toContain('before');
  });
});

describe('validateCoverageLimit', () => {
  it('should accept valid coverage amounts within range', () => {
    expect(validateCoverageLimit(100000)).toBeNull();
    expect(validateCoverageLimit(1000000)).toBeNull();
    expect(validateCoverageLimit(50000000)).toBeNull();
  });

  it('should reject negative amounts', () => {
    const error = validateCoverageLimit(-1000);
    expect(error).not.toBeNull();
    expect(error?.message).toContain('positive');
  });

  it('should reject zero amounts', () => {
    const error = validateCoverageLimit(0);
    expect(error).not.toBeNull();
    expect(error?.message).toContain('positive');
  });

  it('should reject amounts below minimum ($1,000)', () => {
    const error = validateCoverageLimit(500);
    expect(error).not.toBeNull();
    expect(error?.message).toContain('$1,000');
  });

  it('should reject amounts above maximum ($100,000,000)', () => {
    const error = validateCoverageLimit(150000000);
    expect(error).not.toBeNull();
    expect(error?.message).toContain('$100,000,000');
  });
});

describe('validateCarrier', () => {
  const validCarriers = ['State Farm', 'Allstate', 'Progressive', 'Travelers'];

  it('should accept carriers from whitelist', () => {
    expect(validateCarrier('State Farm', validCarriers)).toBeNull();
    expect(validateCarrier('Allstate', validCarriers)).toBeNull();
  });

  it('should accept "Other" as valid carrier', () => {
    expect(validateCarrier('Other', validCarriers)).toBeNull();
  });

  it('should reject empty carrier names', () => {
    const error = validateCarrier('', validCarriers);
    expect(error).not.toBeNull();
    expect(error?.message).toContain('required');
  });

  it('should provide warning for non-whitelisted carriers', () => {
    const error = validateCarrier('Unknown Carrier', validCarriers);
    expect(error).not.toBeNull();
    expect(error?.severity).toBe('warning');
    expect(error?.message).toContain('not in approved list');
  });
});

describe('validateAllFields', () => {
  const validCarriers = ['State Farm', 'Allstate'];

  it('should return valid result when all fields pass validation', () => {
    const fields: FieldValidators = {
      policyNumber: createOCRField('ABC12345', 95),
      effectiveDate: createOCRField('2024-01-01', 92),
      expirationDate: createOCRField('2024-12-31', 90),
      carrierName: createOCRField('State Farm', 88),
      coverageLimits: createOCRField([{ type: 'General Liability', amount: 1000000 }], 85),
    };

    const result = validateAllFields(fields, validCarriers);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should collect all validation errors', () => {
    const fields: FieldValidators = {
      policyNumber: createOCRField('', 95), // Empty
      effectiveDate: createOCRField('2024-12-31', 92),
      expirationDate: createOCRField('2024-01-01', 90), // Before effective
      carrierName: createOCRField('', 88), // Empty
      coverageLimits: createOCRField([{ type: 'GL', amount: -1000 }], 85), // Negative
    };

    const result = validateAllFields(fields, validCarriers);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.field === 'policyNumber')).toBe(true);
    expect(result.errors.some((e) => e.field === 'carrierName')).toBe(true);
  });

  it('should separate errors and warnings', () => {
    const fields: FieldValidators = {
      policyNumber: createOCRField('ABC12345', 95),
      effectiveDate: createOCRField('2024-01-01', 92),
      expirationDate: createOCRField('2024-12-31', 90),
      carrierName: createOCRField('Unknown Carrier', 88), // Warning
      coverageLimits: createOCRField([{ type: 'GL', amount: 1000000 }], 85),
    };

    const result = validateAllFields(fields, validCarriers);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].severity).toBe('warning');
  });
});
