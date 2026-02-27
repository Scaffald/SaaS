/**
 * Document API Service
 * API layer for document extraction and compliance evaluation
 */

import {
  Document,
  DocumentExtractionResponse,
  DocumentUpdatePayload,
  ComplianceEvaluationResponse,
} from '../types/document.types';

/**
 * Get OCR extraction results for a document
 */
export async function getDocumentExtractions(
  documentId: string
): Promise<DocumentExtractionResponse> {
  // Mock implementation for prototype
  const response = await fetch(`/api/v1/documents/${documentId}/extractions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch document extractions: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Update document extraction fields
 */
export async function updateDocumentExtractions(
  payload: DocumentUpdatePayload
): Promise<Document> {
  const response = await fetch(`/api/v1/documents/${payload.documentId}/extractions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update document extractions: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Trigger compliance re-evaluation for a document
 */
export async function evaluateCompliance(
  documentId: string
): Promise<ComplianceEvaluationResponse> {
  const response = await fetch(`/api/v1/documents/${documentId}/evaluate-compliance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to evaluate compliance: ${response.statusText}`);
  }
  return response.json();
}
