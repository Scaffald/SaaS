/**
 * TypeScript types for ACORD 25 Certificate of Insurance parsing
 * REQ-125: Mock OCR & Document Parsing Engine for ACORD 25 Forms
 */

/**
 * Supported insurance carriers with their ACORD 25 variants
 */
export type InsuranceCarrier = 'Travelers' | 'Liberty Mutual' | 'Hartford' | 'Unknown';

/**
 * Coverage types found on ACORD 25 certificates
 */
export type CoverageType =
  | 'general_liability'
  | 'workers_comp'
  | 'commercial_auto'
  | 'umbrella_liability'
  | 'excess_liability';

/**
 * Document status during processing pipeline
 */
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'error';

/**
 * Error codes for document processing
 */
export type ErrorCode =
  | 'UNREADABLE_DOCUMENT'
  | 'INVALID_FORMAT'
  | 'MISSING_CRITICAL_FIELDS'
  | 'LOW_CONFIDENCE';

/**
 * Individual field extraction result with confidence scoring
 */
export interface FieldExtraction<T = string> {
  value: T | null;
  confidence: number; // 0-100
  raw?: string; // Original text extracted
}

/**
 * Coverage details extracted from ACORD 25
 */
export interface CoverageExtraction {
  type: CoverageType;
  amount: number | null;
  confidence: number; // 0-100
  policy_number?: string;
  occurrence_limit?: number;
  aggregate_limit?: number;
}

/**
 * Endorsement flags extracted from ACORD 25
 */
export interface EndorsementExtraction {
  additional_insured: FieldExtraction<boolean>;
  waiver_of_subrogation: FieldExtraction<boolean>;
  primary_non_contributory: FieldExtraction<boolean>;
}

/**
 * Processing error details
 */
export interface ProcessingError {
  code: ErrorCode;
  message: string;
  field?: string;
}

/**
 * Complete extraction result from ACORD 25 document
 * This matches the output schema defined in REQ-125
 */
export interface ACORD25Extraction {
  document_id: string;
  carrier: string;
  carrier_confidence: number;
  policy_number: string | null;
  policy_number_confidence: number;
  effective_date: string | null; // ISO 8601 format
  effective_date_confidence: number;
  expiration_date: string | null; // ISO 8601 format
  expiration_date_confidence: number;
  coverage_types: CoverageExtraction[];
  endorsements: EndorsementExtraction;
  overall_confidence: number;
  requires_manual_review: boolean;
  errors: ProcessingError[];
  extraction_timestamp: string; // ISO 8601 format
  raw_text?: string; // Optional: raw OCR text for debugging
}

/**
 * Input for OCR text extraction
 */
export interface OCRInput {
  documentId: string;
  pdfBuffer?: ArrayBuffer;
  pdfPath?: string;
  carrierHint?: InsuranceCarrier;
}

/**
 * Raw OCR extraction result before parsing
 */
export interface OCRResult {
  documentId: string;
  rawText: string;
  detectedCarrier: InsuranceCarrier;
  carrierConfidence: number;
  timestamp: string;
}

/**
 * Parser input from OCR result
 */
export interface ParserInput {
  documentId: string;
  rawText: string;
  carrier: InsuranceCarrier;
}

/**
 * Validation result for extracted data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ProcessingError[];
  warnings: string[];
}

/**
 * Mock ACORD 25 template for testing
 */
export interface MockACORD25Template {
  carrier: InsuranceCarrier;
  variant: string; // e.g., 'variant A', 'variant B'
  templateText: string;
  expectedExtraction: Partial<ACORD25Extraction>;
}

/**
 * Policy data structure matching database schema (REQ-106)
 */
export interface PolicyData {
  id?: string;
  client_id: string;
  policy_type: CoverageType;
  policy_number: string;
  provider: string;
  coverage_amount: number;
  premium_amount?: number;
  start_date: string; // YYYY-MM-DD format
  end_date: string; // YYYY-MM-DD format
  status: 'active' | 'expired' | 'pending';
  deductible?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * AI extraction record for storing parser results (REQ-106)
 */
export interface AIExtractionRecord {
  id?: string;
  document_id: string;
  extraction_type: 'acord_25';
  extraction_data: ACORD25Extraction;
  confidence_score: number;
  requires_review: boolean;
  created_at?: string;
  updated_at?: string;
}
