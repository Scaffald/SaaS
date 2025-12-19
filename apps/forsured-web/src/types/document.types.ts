/**
 * Document Types for REQ-167
 * Document Metadata Editor & Validation UI
 */

import { OCRExtractionResult, AuditEntry, ComplianceEvaluationResult } from './ocr.types';

export type DocumentStatus = 'pending' | 'processing' | 'extracted' | 'validated' | 'failed';

/**
 * Document metadata
 */
export interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  status: DocumentStatus;
  projectId?: string;
  clientId?: string;
  extractionResult?: OCRExtractionResult;
  complianceStatus?: ComplianceEvaluationResult;
  auditHistory: AuditEntry[];
}

/**
 * Document update payload
 */
export interface DocumentUpdatePayload {
  documentId: string;
  extractionResult: Partial<OCRExtractionResult>;
  changedBy: string;
}

/**
 * API response for document extraction
 */
export interface DocumentExtractionResponse {
  document: Document;
  extraction: OCRExtractionResult;
}

/**
 * API response for compliance evaluation
 */
export interface ComplianceEvaluationResponse {
  documentId: string;
  status: ComplianceEvaluationResult;
}
