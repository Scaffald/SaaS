/**
 * Validation utilities for OCR field validation (REQ-167)
 */

import { ValidationError, ValidationResult, OCRField, CoverageLimit } from '../types/ocr.types';

/**
 * Validate policy number
 * - Required
 * - Alphanumeric (with hyphens allowed)
 * - 5-50 characters
 */
export function validatePolicyNumber(value: string): ValidationError | null {
  if (!value || value.trim().length === 0) {
    return {
      field: 'policyNumber',
      message: 'Policy number is required',
      severity: 'error',
    };
  }

  if (value.length < 5 || value.length > 50) {
    return {
      field: 'policyNumber',
      message: 'Policy number must be between 5-50 characters',
      severity: 'error',
    };
  }

  // Allow alphanumeric and hyphens
  if (!/^[A-Za-z0-9-]+$/.test(value)) {
    return {
      field: 'policyNumber',
      message: 'Policy number must be alphanumeric (hyphens allowed)',
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validate date format and range
 * - Must be valid date
 * - Not more than 10 years in past or future
 */
export function validateDate(value: string, fieldName: string): ValidationError | null {
  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return {
      field: fieldName.replace(/\s+/g, ''),
      message: `${fieldName} must be a valid date`,
      severity: 'error',
    };
  }

  const now = new Date();
  const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
  const tenYearsFromNow = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate());

  if (date < tenYearsAgo || date > tenYearsFromNow) {
    return {
      field: fieldName.replace(/\s+/g, ''),
      message: `${fieldName} must be within 10 years of today`,
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validate date range
 * - Effective date must be before expiration date
 */
export function validateDateRange(
  effectiveDate: string,
  expirationDate: string
): ValidationError | null {
  const effective = new Date(effectiveDate);
  const expiration = new Date(expirationDate);

  if (effective >= expiration) {
    return {
      field: 'dateRange',
      message: 'Effective date must be before expiration date',
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validate coverage limit
 * - Must be positive
 * - Between $1,000 and $100,000,000
 */
export function validateCoverageLimit(amount: number): ValidationError | null {
  if (amount <= 0) {
    return {
      field: 'coverageLimit',
      message: 'Coverage limit must be positive',
      severity: 'error',
    };
  }

  if (amount < 1000) {
    return {
      field: 'coverageLimit',
      message: 'Coverage limit must be at least $1,000',
      severity: 'error',
    };
  }

  if (amount > 100000000) {
    return {
      field: 'coverageLimit',
      message: 'Coverage limit cannot exceed $100,000,000',
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validate carrier name
 * - Required
 * - Should be from whitelist or "Other"
 */
export function validateCarrier(
  value: string,
  approvedCarriers: string[]
): ValidationError | null {
  if (!value || value.trim().length === 0) {
    return {
      field: 'carrierName',
      message: 'Carrier name is required',
      severity: 'error',
    };
  }

  if (value === 'Other') {
    return null;
  }

  if (!approvedCarriers.includes(value)) {
    return {
      field: 'carrierName',
      message: 'Carrier is not in approved list. Select "Other" if not listed.',
      severity: 'warning',
    };
  }

  return null;
}

/**
 * Field validators interface for validateAllFields
 */
export interface FieldValidators {
  policyNumber: OCRField<string>;
  effectiveDate: OCRField<string>;
  expirationDate: OCRField<string>;
  carrierName: OCRField<string>;
  coverageLimits: OCRField<CoverageLimit[]>;
}

/**
 * Validate all fields and return comprehensive result
 */
export function validateAllFields(
  fields: FieldValidators,
  approvedCarriers: string[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate policy number
  const policyError = validatePolicyNumber(fields.policyNumber.value);
  if (policyError) {
    if (policyError.severity === 'error') {
      errors.push(policyError);
    } else {
      warnings.push(policyError);
    }
  }

  // Validate effective date
  const effectiveDateError = validateDate(fields.effectiveDate.value, 'Effective Date');
  if (effectiveDateError) {
    if (effectiveDateError.severity === 'error') {
      errors.push(effectiveDateError);
    } else {
      warnings.push(effectiveDateError);
    }
  }

  // Validate expiration date
  const expirationDateError = validateDate(fields.expirationDate.value, 'Expiration Date');
  if (expirationDateError) {
    if (expirationDateError.severity === 'error') {
      errors.push(expirationDateError);
    } else {
      warnings.push(expirationDateError);
    }
  }

  // Validate date range
  if (!effectiveDateError && !expirationDateError) {
    const dateRangeError = validateDateRange(
      fields.effectiveDate.value,
      fields.expirationDate.value
    );
    if (dateRangeError) {
      if (dateRangeError.severity === 'error') {
        errors.push(dateRangeError);
      } else {
        warnings.push(dateRangeError);
      }
    }
  }

  // Validate carrier
  const carrierError = validateCarrier(fields.carrierName.value, approvedCarriers);
  if (carrierError) {
    if (carrierError.severity === 'error') {
      errors.push(carrierError);
    } else {
      warnings.push(carrierError);
    }
  }

  // Validate coverage limits
  for (const limit of fields.coverageLimits.value) {
    const limitError = validateCoverageLimit(limit.amount);
    if (limitError) {
      if (limitError.severity === 'error') {
        errors.push({
          ...limitError,
          field: `coverageLimit-${limit.type}`,
          message: `${limit.type}: ${limitError.message}`,
        });
      } else {
        warnings.push({
          ...limitError,
          field: `coverageLimit-${limit.type}`,
          message: `${limit.type}: ${limitError.message}`,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
