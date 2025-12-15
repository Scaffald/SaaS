/**
 * REQ-124: Document Upload & Storage - DocumentService
 * REQ-1: Document Management with Scaffald integration
 *
 * Handles document upload, validation, storage, and retrieval via Scaffald API.
 *
 * ## Storage Backends
 *
 * Scaffald supports multiple storage backends configured per user:
 * - `supabase` (default): Built-in Supabase Storage
 * - `dropbox`: User's Dropbox account (requires OAuth)
 * - `google_drive`: User's Google Drive account (requires OAuth)
 *
 * Users can configure their preferred backend in Settings > Document Storage.
 */

import mockDatabase from '../../utils/mockDataStore'
import { scaffaldClient } from '../scaffald/client'
import type {
  Document,
  DocumentUpload,
  DocumentValidationResult,
  DocumentFilter,
  DocumentStatus,
} from '../../types/document'
import {
  MAX_FILE_SIZE,
  MIN_FILE_SIZE,
  ALLOWED_FILE_TYPE,
  ALLOWED_FILE_EXTENSION,
} from '../../types/document'
import type { DocumentCategory, UploadDocumentResponse } from '../scaffald/types'

console.log('[DocumentService] Mode: Scaffald')

export class DocumentService {
  /**
   * Validate a file for upload
   */
  validateFile(file: File): DocumentValidationResult {
    const errors: string[] = []

    // Check file type
    const hasValidType = file.type === ALLOWED_FILE_TYPE
    const hasValidExtension = file.name.toLowerCase().endsWith(ALLOWED_FILE_EXTENSION)

    if (!hasValidType || !hasValidExtension) {
      errors.push('File type not supported. Please upload PDF files only.')
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push('File size exceeds 10MB limit. Please compress or split the file.')
    }

    if (file.size < MIN_FILE_SIZE) {
      errors.push('File is too small (minimum 1KB). The file may be corrupted.')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Sanitize file name to remove special characters
   */
  sanitizeFileName(fileName: string): string {
    // Remove all special characters except letters, numbers, hyphens, underscores, periods
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '')
  }

  /**
   * Convert file to Base64 encoded string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Extract base64 data (remove data:application/pdf;base64, prefix)
        const base64 = result.split(',')[1] || result
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Generate SHA-256 hash of file content for duplicate detection
   */
  private async generateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    return hashHex
  }

  /**
   * Upload a document via Scaffald API
   *
   * All uploads go through Scaffald which handles storage backend routing
   * based on user preferences (Supabase, Dropbox, or Google Drive).
   */
  async uploadDocument(
    uploadData: DocumentUpload & {
      organizationId: string
      category?: DocumentCategory
      description?: string
      tags?: string[]
      isTemplate?: boolean
      folderId?: string | null
    }
  ): Promise<Document> {
    // Validate file
    const validation = this.validateFile(uploadData.file)
    if (!validation.valid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`)
    }

    // Validate organizationId is provided
    if (!uploadData.organizationId) {
      throw new Error('organizationId is required for document upload')
    }

    // Convert file to Base64
    const fileData = await this.fileToBase64(uploadData.file)

    // Generate file hash for integrity verification
    const fileHash = await this.generateFileHash(uploadData.file)

    // Sanitize file name
    const sanitizedName = this.sanitizeFileName(uploadData.file.name)

    console.log('[DocumentService] Uploading via Scaffald')
    try {
      const scaffaldResponse = await this.uploadToScaffald({
        organizationId: uploadData.organizationId,
        file: uploadData.file,
        fileName: sanitizedName,
        fileData,
        fileHash,
        category: uploadData.category,
        description: uploadData.description,
        tags: uploadData.tags,
        isTemplate: uploadData.isTemplate,
        folderId: uploadData.folderId,
      })

      // Convert Scaffald response to local Document format
      return this.scaffaldToLocalDocument(scaffaldResponse, uploadData)
    } catch (error) {
      console.error('[DocumentService] Scaffald upload failed:', error)
      throw error
    }
  }

  /**
   * Upload document to Scaffald API
   */
  private async uploadToScaffald(params: {
    organizationId: string
    file: File
    fileName: string
    fileData: string
    fileHash: string
    category?: DocumentCategory
    description?: string
    tags?: string[]
    isTemplate?: boolean
    folderId?: string | null
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
    })
  }

  /**
   * Convert Scaffald response to local Document format
   */
  private scaffaldToLocalDocument(
    response: UploadDocumentResponse,
    uploadData: DocumentUpload & { organizationId: string }
  ): Document {
    return {
      id: response.id,
      filename: response.name,
      docType: 'coi' as const, // Default to COI for insurance documents
      status: 'pending',
      clientId: uploadData.organizationId,
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
      scaffaldId: string
      storageBackend: string
      storagePath: string
      downloadUrl: string | null
    }
  }

  /**
   * Get documents with optional filtering
   *
   * Note: For development/testing, this still uses MockDatabase for read operations.
   * In production, use scaffaldClient.documents.list() for Scaffald-stored documents.
   */
  async getDocuments(filters: DocumentFilter = {}): Promise<Document[]> {
    const documents = await mockDatabase.query<Document>('documents', filters, {
      column: 'upload_date',
      ascending: false,
    })

    return documents
  }

  /**
   * Get a single document by ID
   *
   * Note: For development/testing, this still uses MockDatabase for read operations.
   * In production, use scaffaldClient.documents.get() for Scaffald-stored documents.
   */
  async getDocumentById(id: string): Promise<Document | null> {
    return await mockDatabase.queryOne<Document>('documents', { id })
  }

  /**
   * Update document status
   *
   * Note: For development/testing, this still uses MockDatabase for read operations.
   * In production, use scaffaldClient.documents.update() for Scaffald-stored documents.
   */
  async updateDocumentStatus(
    id: string,
    status: DocumentStatus,
    errorMessage?: string
  ): Promise<Document> {
    const updates: Partial<Document> = {
      status,
    }

    if (errorMessage) {
      updates.error_message = errorMessage
    }

    return await mockDatabase.update<Document>('documents', id, updates)
  }

  /**
   * Delete a document
   *
   * Note: For development/testing, this still uses MockDatabase for read operations.
   * In production, use scaffaldClient.documents.delete() for Scaffald-stored documents.
   */
  async deleteDocument(id: string): Promise<void> {
    await mockDatabase.delete('documents', id)
  }

  /**
   * Delete multiple documents
   *
   * Note: For development/testing, this still uses MockDatabase for read operations.
   * In production, use scaffaldClient.documents.delete() for each Scaffald-stored document.
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    for (const id of ids) {
      await mockDatabase.delete('documents', id)
    }
  }
}
