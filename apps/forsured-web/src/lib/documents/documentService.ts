/**
 * REQ-124: Document Upload & Storage - DocumentService
 * Handles document upload, validation, storage, and retrieval
 */

import mockDatabase from '../../utils/mockDataStore';
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
   * Upload a document
   */
  async uploadDocument(uploadData: DocumentUpload): Promise<Document> {
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

    // Create document record
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
}
