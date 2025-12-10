/**
 * Data validation functions for ACORD 25 extraction
 * REQ-125: Mock OCR & Document Parsing Engine for ACORD 25 Forms
 */

import type { ProcessingError } from '../types/acord25';

/**
 * Validates date format and converts to ISO 8601
 * Supports MM/DD/YYYY, YYYY-MM-DD formats
 */
export function validateAndParseDate(dateString: string | null): {
  isValid: boolean;
  isoDate: string | null;
  error?: string;
} {
  if (!dateString) {
    return { isValid: false, isoDate: null, error: 'Date is null or empty' };
  }

  // Remove whitespace
  const cleaned = dateString.trim();

  // Try MM/DD/YYYY format
  const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const mmddyyyyMatch = cleaned.match(mmddyyyyPattern);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Validate date is real
    if (
      date.getFullYear() === parseInt(year) &&
      date.getMonth() === parseInt(month) - 1 &&
      date.getDate() === parseInt(day)
    ) {
      // Pad month and day to 2 digits
      const paddedMonth = month.padStart(2, '0');
      const paddedDay = day.padStart(2, '0');
      return {
        isValid: true,
        isoDate: `${year}-${paddedMonth}-${paddedDay}`,
      };
    }
  }

  // Try YYYY-MM-DD format (ISO format)
  const isoPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const isoMatch = cleaned.match(isoPattern);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Validate date is real
    if (
      date.getFullYear() === parseInt(year) &&
      date.getMonth() === parseInt(month) - 1 &&
      date.getDate() === parseInt(day)
    ) {
      return {
        isValid: true,
        isoDate: date.toISOString().split('T')[0],
      };
    }
  }

  return {
    isValid: false,
    isoDate: null,
    error: `Invalid date format: ${dateString}`,
  };
}

/**
 * Validates and parses currency amounts
 * Supports: $1M, $2M, $1,000,000, 1000000
 */
export function validateAndParseCurrency(amountString: string | null): {
  isValid: boolean;
  amount: number | null;
  error?: string;
} {
  if (!amountString) {
    return { isValid: false, amount: null, error: 'Amount is null or empty' };
  }

  // Remove whitespace
  const cleaned = amountString.trim();

  // Pattern for abbreviated format: $1M, $2M, $5M
  const abbreviatedPattern = /^\$?\s*(\d+(?:\.\d+)?)\s*M(?:illion)?/i;
  const abbreviatedMatch = cleaned.match(abbreviatedPattern);
  if (abbreviatedMatch) {
    const amount = parseFloat(abbreviatedMatch[1]) * 1000000;
    return { isValid: true, amount };
  }

  // Pattern for numeric format: $1,000,000 or 1000000
  const numericPattern = /^\$?(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2})?$/;
  const numericMatch = cleaned.match(numericPattern);
  if (numericMatch) {
    const amount = parseFloat(numericMatch[1].replace(/,/g, ''));
    return { isValid: true, amount };
  }

  // Pattern for written format: "One Million Dollars"
  const writtenPatterns: Record<string, number> = {
    'one million': 1000000,
    'two million': 2000000,
    'three million': 3000000,
    'four million': 4000000,
    'five million': 5000000,
    'ten million': 10000000,
  };

  const lowercased = cleaned.toLowerCase().replace(/dollars?/g, '').trim();
  for (const [pattern, amount] of Object.entries(writtenPatterns)) {
    if (lowercased.includes(pattern)) {
      return { isValid: true, amount };
    }
  }

  return {
    isValid: false,
    amount: null,
    error: `Invalid currency format: ${amountString}`,
  };
}

/**
 * Validates policy number format
 * Pattern: XX-XXXX-XXXXXXXX or variations
 */
export function validatePolicyNumber(policyNumber: string | null): {
  isValid: boolean;
  normalized: string | null;
  error?: string;
} {
  if (!policyNumber) {
    return { isValid: false, normalized: null, error: 'Policy number is null or empty' };
  }

  // Remove whitespace
  const cleaned = policyNumber.trim();

  // Pattern: 2-3 chars, dash, 2-6 alphanumeric chars, dash, 4-8 digits
  const policyPattern = /^[A-Z]{2,3}-[A-Z0-9]{2,6}-\d{4,8}$/i;
  if (policyPattern.test(cleaned)) {
    return { isValid: true, normalized: cleaned.toUpperCase() };
  }

  // Also accept variations without dashes
  const noDashPattern = /^[A-Z]{2,3}[A-Z0-9]{2,6}\d{4,8}$/i;
  if (noDashPattern.test(cleaned)) {
    // Try to normalize by adding dashes
    const normalized = cleaned.toUpperCase();
    return { isValid: true, normalized };
  }

  return {
    isValid: false,
    normalized: null,
    error: `Invalid policy number format: ${policyNumber}`,
  };
}

/**
 * Performs sanity checks on coverage limits
 */
export function validateCoverageLimit(amount: number | null, coverageType: string): {
  isValid: boolean;
  warning?: string;
} {
  if (amount === null) {
    return { isValid: false };
  }

  // Sanity check: coverage amounts should be reasonable
  const minCoverage = 100000; // $100K minimum
  const maxCoverage = 100000000; // $100M maximum

  if (amount < minCoverage) {
    return {
      isValid: true,
      warning: `Coverage amount ${amount} for ${coverageType} seems unusually low (< $100K)`,
    };
  }

  if (amount > maxCoverage) {
    return {
      isValid: true,
      warning: `Coverage amount ${amount} for ${coverageType} seems unusually high (> $100M)`,
    };
  }

  return { isValid: true };
}

/**
 * Validates date range (effective date must be before expiration date)
 */
export function validateDateRange(
  effectiveDate: string | null,
  expirationDate: string | null
): {
  isValid: boolean;
  error?: string;
} {
  if (!effectiveDate || !expirationDate) {
    return {
      isValid: false,
      error: 'Both effective and expiration dates are required',
    };
  }

  const effective = new Date(effectiveDate);
  const expiration = new Date(expirationDate);

  if (effective >= expiration) {
    return {
      isValid: false,
      error: 'Effective date must be before expiration date',
    };
  }

  // Check if dates are in reasonable range (not in distant past or future)
  const now = new Date();
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  const fiveYearsAhead = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());

  if (effective < fiveYearsAgo || effective > fiveYearsAhead) {
    return {
      isValid: true,
      error: `Effective date ${effectiveDate} is outside reasonable range`,
    };
  }

  return { isValid: true };
}

/**
 * Checks for missing critical fields
 */
export function checkMissingFields(extraction: {
  policy_number: string | null;
  carrier: string;
  effective_date: string | null;
  expiration_date: string | null;
  coverage_types: Array<{ type: string; amount: number | null }>;
}): ProcessingError[] {
  const errors: ProcessingError[] = [];

  if (!extraction.policy_number) {
    errors.push({
      code: 'MISSING_CRITICAL_FIELDS',
      message: 'Policy number is required',
      field: 'policy_number',
    });
  }

  if (!extraction.carrier || extraction.carrier === 'Unknown') {
    errors.push({
      code: 'MISSING_CRITICAL_FIELDS',
      message: 'Insurance carrier could not be identified',
      field: 'carrier',
    });
  }

  if (!extraction.effective_date) {
    errors.push({
      code: 'MISSING_CRITICAL_FIELDS',
      message: 'Policy effective date is required',
      field: 'effective_date',
    });
  }

  if (!extraction.expiration_date) {
    errors.push({
      code: 'MISSING_CRITICAL_FIELDS',
      message: 'Policy expiration date is required',
      field: 'expiration_date',
    });
  }

  if (extraction.coverage_types.length === 0) {
    errors.push({
      code: 'MISSING_CRITICAL_FIELDS',
      message: 'At least one coverage type is required',
      field: 'coverage_types',
    });
  }

  return errors;
}

/**
 * Calculates confidence score category
 */
export function getConfidenceCategory(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}
