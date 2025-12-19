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
import { supabase } from '../supabase'

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
   */
  async getDocuments(filters: DocumentFilter = {}): Promise<Document[]> {
    let query = supabase.schema('forsured').from('documents').select('*').order('uploaded_at', { ascending: false })

    // Apply filters if provided
    if (filters.clientId) {
      query = query.eq('clientId', filters.clientId)
    }
    if (filters.projectId) {
      query = query.eq('projectId', filters.projectId)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.docType) {
      query = query.eq('docType', filters.docType)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Get a single document by ID
   */
  async getDocumentById(id: string): Promise<Document | null> {
    const { data, error } = await supabase.schema('forsured').from('documents').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
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
      status,
    }

    if (errorMessage) {
      updates.error_message = errorMessage
    }

    const { data, error } = await supabase.schema('forsured').from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase.schema('forsured').from('documents').delete().eq('id', id)

    if (error) throw error
  }

  /**
   * Delete multiple documents
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    const { error } = await supabase.schema('forsured').from('documents').delete().in('id', ids)

    if (error) throw error
  }
}
