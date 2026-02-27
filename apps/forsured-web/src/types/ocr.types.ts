/**
 * OCR Extraction Types for
 * Document Metadata Editor & Validation UI
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type DocumentType = 'coi' | 'policy' | 'endorsement' | 'other';

/**
 * Field confidence score (0-100)
 * - High: ≥90 (green)
 * - Medium: 70-89 (yellow)
 * - Low: <70 (red)
 */
export interface FieldConfidence {
  score: number; // 0-100
  level: ConfidenceLevel;
}

/**
 * Individual extracted field with confidence
 */
export interface OCRField<T = string> {
  value: T;
  confidence: FieldConfidence;
  originalValue: T; // For revert functionality
  edited: boolean;
  reviewRequired: boolean;
  reviewed: boolean;
}

/**
 * Coverage limit with type and amount
 */
export interface CoverageLimit {
  type: string;
  amount: number;
}

/**
 * Complete OCR extraction result
 */
export interface OCRExtractionResult {
  id: string;
  documentId: string;
  extractedAt: string;
  policyNumber: OCRField<string>;
  effectiveDate: OCRField<string>;
  expirationDate: OCRField<string>;
  carrierName: OCRField<string>;
  coverageLimits: OCRField<CoverageLimit[]>;
  namedInsureds?: OCRField<string[]>;
  additionalInsureds?: OCRField<string[]>;
}

/**
 * Audit trail entry for field changes
 */
export interface AuditEntry {
  id: string;
  fieldName: string;
  oldValue: string | number | CoverageLimit[] | string[];
  newValue: string | number | CoverageLimit[] | string[];
  confidenceAtEdit: number;
  changedBy: string;
  changedAt: string;
}

/**
 * Validation error for a specific field
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validation result for the entire form
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Compliance re-evaluation result
 */
export interface ComplianceEvaluationResult {
  status: 'compliant' | 'warning' | 'critical' | 'non_compliant' | 'partial';
  score: number;
  issues: string[];
  evaluatedAt: string;
}

/**
 * Helper to determine confidence level from score
 */
export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 90) return 'high';
  if (score >= 70) return 'medium';
  return 'low';
}

/**
 * Helper to create field confidence object
 */
export function createFieldConfidence(score: number): FieldConfidence {
  return {
    score,
    level: getConfidenceLevel(score),
  };
}

/**
 * Helper to create OCR field
 */
export function createOCRField<T>(
  value: T,
  confidenceScore: number,
  edited = false
): OCRField<T> {
  const confidence = createFieldConfidence(confidenceScore);
  return {
    value,
    confidence,
    originalValue: value,
    edited,
    reviewRequired: confidence.level === 'low',
    reviewed: false,
  };
}
