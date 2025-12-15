/**
 * REQ-124: Document Upload & Storage - DocumentService
 * REQ-1: Document Management with Scaffald integration
 *
 * Handles document upload, validation, storage, and retrieval.
 * Supports dual-mode: MockDatabase (development) and Scaffald (production).
 *
 * ## Migration Notice
 *
 * The MockDatabase storage backend is **DEPRECATED** and will be removed
 * in a future version. New deployments should use Scaffald storage by setting:
 *
 *   VITE_USE_SCAFFALD_DOCUMENTS=true
 *
 * To migrate existing MockDatabase documents to Scaffald, run:
 *
 *   npx tsx scripts/migrate-documents-to-scaffald.ts --org-id <org-id>
 *
 * ## Storage Backends
 *
 * Scaffald supports multiple storage backends:
 * - `supabase` (default): Built-in Supabase Storage
 * - `dropbox`: User's Dropbox account (requires OAuth)
 * - `google_drive`: User's Google Drive account (requires OAuth)
 *
 * Users can configure their preferred backend in Settings > Document Storage.
 */

import mockDatabase from '../../utils/mockDataStore';
import { scaffaldClient } from '../scaffald/client';
import type {
  Document,
  DocumentUpload,
  DocumentValidationResult,
  DocumentFilter,
  DocumentStatus
} from '../../types/document';
import {
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
  ALLOWED_FILE_TYPE,
  ALLOWED_FILE_EXTENSION
} from '../../types/document';
import type { DocumentCategory, UploadDocumentResponse } from '../scaffald/types';

/**
 * Feature flag to toggle between MockDatabase and Scaffald document storage.
 *
 * @deprecated MockDatabase storage is deprecated. Set VITE_USE_SCAFFALD_DOCUMENTS=true
 * to use Scaffald storage. MockDatabase will be removed in a future release.
 */
const USE_SCAFFALD_DOCUMENTS = import.meta.env.VITE_USE_SCAFFALD_DOCUMENTS === 'true';

// Log the current mode and deprecation warning on module load
if (!USE_SCAFFALD_DOCUMENTS) {
  console.warn(
    '[DocumentService] WARNING: Using deprecated MockDatabase storage. ' +
      'Set VITE_USE_SCAFFALD_DOCUMENTS=true to use Scaffald. ' +
      'Run migrate-documents-to-scaffald.ts to migrate existing documents.'
  );
}
console.log(`[DocumentService] Mode: ${USE_SCAFFALD_DOCUMENTS ? 'Scaffald' : 'MockDatabase (DEPRECATED)'}`);

export class DocumentService {
  /**
   * Validate a file for upload
   */
  validateFile(file: File): DocumentValidationResult {
    const errors: string[] = [];

    // Check file type
    const hasValidType = file.type === ALLOWED_FILE_TYPE;
    const hasValidExtension = file.name.toLowerCase().endsWith(ALLOWED_FILE_EXTENSION);

    if (!hasValidType || !hasValidExtension) {
      errors.push('File type not supported. Please upload PDF files only.');
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push('File size exceeds 10MB limit. Please compress or split the file.');
    }

    if (file.size < MIN_FILE_SIZE) {
      errors.push('File is too small (minimum 1KB). The file may be corrupted.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize file name to remove special characters
   */
  sanitizeFileName(fileName: string): string {
    // Remove all special characters except letters, numbers, hyphens, underscores, periods
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '');
  }

  /**
   * Convert file to Base64 encoded string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 data (remove data:application/pdf;base64, prefix)
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate SHA-256 hash of file content for duplicate detection
   */
  private async generateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Check if a file with the same hash already exists for this project
   */
  async checkDuplicate(projectId: string, file: File): Promise<boolean> {
    const fileHash = await this.generateFileHash(file);
    const existingDocuments = await mockDatabase.query<Document>('documents', {
      project_id: projectId
    });

    return existingDocuments.some(doc => doc.file_hash === fileHash);
  }

  /**
   * Upload a document (dual-mode: MockDatabase or Scaffald)
   *
   * When VITE_USE_SCAFFALD_DOCUMENTS=true, uploads via Scaffald API.
   * Otherwise, uses MockDatabase for development.
   */
  async uploadDocument(
    uploadData: DocumentUpload & {
      // Extended fields for Scaffald integration
      organizationId?: string;
      category?: DocumentCategory;
      description?: string;
      tags?: string[];
      isTemplate?: boolean;
      folderId?: string | null;
    }
  ): Promise<Document> {
    // Validate file
    const validation = this.validateFile(uploadData.file);
    if (!validation.valid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Convert file to Base64
    const fileData = await this.fileToBase64(uploadData.file);

    // Generate file hash
    const fileHash = await this.generateFileHash(uploadData.file);

    // Sanitize file name
    const sanitizedName = this.sanitizeFileName(uploadData.file.name);

    // Use Scaffald when enabled
    if (USE_SCAFFALD_DOCUMENTS && uploadData.organizationId) {
      console.log('[DocumentService] Uploading via Scaffald');
      try {
        const scaffaldResponse = await this.uploadToScaffald({
          ...uploadData,
          organizationId: uploadData.organizationId,
          fileName: sanitizedName,
          fileData,
          fileHash,
        });

        // Convert Scaffald response to local Document format
        return this.scaffaldToLocalDocument(scaffaldResponse, uploadData);
      } catch (error) {
        console.error('[DocumentService] Scaffald upload failed:', error);
        throw error;
      }
    }

    // Use MockDatabase when Scaffald is disabled or organizationId is not provided
    console.log('[DocumentService] Uploading via MockDatabase');
    const documentData = {
      project_id: uploadData.project_id,
      subcontractor_id: uploadData.subcontractor_id,
      uploader_id: uploadData.uploader_id,
      file_name: sanitizedName,
      file_size: uploadData.file.size,
      file_type: uploadData.file.type,
      file_data: fileData,
      file_hash: fileHash,
      upload_date: new Date().toISOString(),
      status: 'pending' as DocumentStatus,
      error_message: undefined
    };

    const document = await mockDatabase.insert<Document>('documents', documentData);

    return document;
  }

  /**
   * Upload document to Scaffald API
   */
  private async uploadToScaffald(params: {
    organizationId: string;
    file: File;
    fileName: string;
    fileData: string;
    fileHash: string;
    category?: DocumentCategory;
    description?: string;
    tags?: string[];
    isTemplate?: boolean;
    folderId?: string | null;
  }): Promise<UploadDocumentResponse> {
    return scaffaldClient.documents.upload({
      organizationId: params.organizationId,
      name: params.fileName,
      file: params.fileData,
      fileName: params.fileName,
      contentType: params.file.type,
      fileSize: params.file.size,
      category: params.category || 'compliance',
      description: params.description,
      tags: params.tags || [],
      isTemplate: params.isTemplate || false,
      folderId: params.folderId,
    });
  }

  /**
   * Convert Scaffald response to local Document format
   */
  private scaffaldToLocalDocument(
    response: UploadDocumentResponse,
    uploadData: DocumentUpload & { organizationId?: string }
  ): Document {
    return {
      id: response.id,
      filename: response.name,
      docType: 'coi' as any, // Default to COI for insurance documents
      status: 'pending',
      clientId: uploadData.organizationId || '',
      clientName: '',
      clientType: 'subcontractor',
      projectId: uploadData.projectId || null,
      projectName: null,
      contentPreview: null,
      fileSize: response.fileSize,
      mimeType: response.mimeType,
      uploadedBy: uploadData.uploadedBy,
      uploadedAt: response.createdAt,
      verifiedAt: null,
      expiresAt: null,
      createdAt: response.createdAt,
      updatedAt: response.createdAt,
      // Extended properties for internal use
      scaffaldId: response.id,
      storageBackend: response.storageBackend,
      storagePath: response.storagePath,
      downloadUrl: response.downloadUrl,
    } as Document & {
      scaffaldId: string;
      storageBackend: string;
      storagePath: string;
      downloadUrl: string | null;
    };
  }

  /**
   * Get documents with optional filtering
   */
  async getDocuments(filters: DocumentFilter = {}): Promise<Document[]> {
    const documents = await mockDatabase.query<Document>('documents', filters, {
      column: 'upload_date',
      ascending: false
    });

    return documents;
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
    return await mockDatabase.queryOne<Document>('documents', { id });
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    id: string,
    status: DocumentStatus,
    errorMessage?: string
  ): Promise<Document> {
    const updates: Partial<Document> = {
      status
    };

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    return await mockDatabase.update<Document>('documents', id, updates);
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    await mockDatabase.delete('documents', id);
  }

  /**
   * Bulk delete documents
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    for (const id of ids) {
      await mockDatabase.delete('documents', id);
    }
  }

  /**
   * Check if Scaffald document storage is enabled
   */
  isScaffaldEnabled(): boolean {
    return USE_SCAFFALD_DOCUMENTS;
  }
}

// Export the feature flag for components that need to check the mode
export const isUsingScaffaldDocuments = USE_SCAFFALD_DOCUMENTS;
