/**
 * Document Types
 * REQ-284: Document Organization by Client/Project/GC
 * REQ-124: Document Upload & Storage
 */

import type { DocumentType, DocumentStatus } from './document-filters';

/**
 * File upload constraints
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MIN_FILE_SIZE = 1024; // 1KB
export const ALLOWED_FILE_TYPE = 'application/pdf';
export const ALLOWED_FILE_EXTENSION = '.pdf';

/**
 * Document validation result
 */
export interface DocumentValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Document upload payload
 */
export interface DocumentUpload {
  file: File;
  projectId: string;
  uploadedBy: string;
}

/**
 * Document filter for queries
 */
export interface DocumentFilter {
  project_id?: string;
  status?: string;
  uploader_id?: string;
}

/**
 * Document entity from database
 */
export interface Document {
  id: string;
  filename: string;
  docType: DocumentType;
  status: DocumentStatus;
  clientId: string;
  clientName: string;
  clientType: 'gc' | 'subcontractor';
  projectId: string | null;
  projectName: string | null;
  contentPreview: string | null;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  verifiedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Document list item (lighter version for lists)
 */
export interface DocumentListItem {
  id: string;
  filename: string;
  docType: DocumentType;
  status: DocumentStatus;
  clientId: string;
  clientName: string;
  projectId: string | null;
  projectName: string | null;
  updatedAt: string;
  expiresAt: string | null;
}

/**
 * Document list response from API
 */
export interface DocumentListResponse {
  documents: DocumentListItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Document filter parameters for API
 */
export interface DocumentFilterParams {
  organizationId: string;
  clientId?: string;
  projectId?: string;
  docType?: DocumentType;
  status?: DocumentStatus;
  search?: string;
  limit?: number;
  offset?: number;
}
