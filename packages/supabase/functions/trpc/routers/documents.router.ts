import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, t } from '../middleware.ts'
import { createStorageRouter } from './utils/storage-router.ts'
import type { StorageBackendType } from './utils/storage-backends/index.ts'
import { createUploadQueue, type UploadTask } from './utils/upload-queue.ts'
import { getDocumentCache } from './utils/document-cache.ts'
import { getPerformanceMonitor } from './utils/performance-monitoring.ts'

/**
 * Document category enum matching database type
 */
const DocumentCategorySchema = z.enum([
  'contracts',
  'templates',
  'compliance',
  'certifications',
  'onboarding',
  'general',
  'other',
])

/**
 * Base document input schema for uploads
 */
const DocumentUploadInputSchema = z.object({
  organizationId: z.string().uuid(),
  folderId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  category: DocumentCategorySchema.optional().default('general'),
  tags: z.array(z.string()).optional().default([]),
  isTemplate: z.boolean().optional().default(false),
  templateVariables: z.array(z.unknown()).optional().default([]),
  // File data
  file: z.string(), // base64 encoded file data
  fileName: z.string(),
  contentType: z.string(),
  fileSize: z.number().positive(),
})

/**
 * Document list filter schema
 */
const DocumentListInputSchema = z.object({
  organizationId: z.string().uuid(),
  folderId: z.string().uuid().optional().nullable(),
  category: DocumentCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  oauthAppId: z.string().optional(), // Filter by creating OAuth app
  isTemplate: z.boolean().optional(),
  includeDeleted: z.boolean().optional().default(false),
  search: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['createdAt', 'name', 'updatedAt', 'latestSizeBytes']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

/**
 * Document update schema
 */
const DocumentUpdateInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  category: DocumentCategorySchema.optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().uuid().optional().nullable(),
  isTemplate: z.boolean().optional(),
  templateVariables: z.array(z.unknown()).optional(),
})

/**
 * Documents router - handles document upload, retrieval, and management
 * Supports OAuth app identification via oauth_app_id stamping
 */
export const documentsRouter = t.router({
  /**
   * Upload a new document
   * Creates document record and uploads file to Supabase Storage
   * Stamps oauth_app_id from request header if present
   */
  upload: protectedProcedure
    .input(DocumentUploadInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      // Extract oauth_app_id from context if available (set by OAuth middleware)
      const oauthAppId = (ctx as { oauthAppId?: string }).oauthAppId || null

      try {
        // Convert base64 to Uint8Array for storage
        const base64Data = input.file.includes(',') ? input.file.split(',')[1] : input.file
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Generate storage path
        const timestamp = Date.now()
        const storagePath = `org/${input.organizationId}/docs/${timestamp}-${input.fileName}`

        // Get storage backend based on user preference
        const storageRouter = createStorageRouter(supabase, user.id)
        const { backend, usedFallback, actualBackend } = await storageRouter.getBackend()

        // Log if fallback was used
        if (usedFallback) {
          console.warn(`[documents.upload] Used fallback storage for user ${user.id}, actual backend: ${actualBackend}`)
        }

        // Upload using the selected storage backend
        let checksum: string
        try {
          const uploadResult = await backend.upload(bytes, storagePath, {
            contentType: input.contentType,
            upsert: false,
          })
          checksum = uploadResult.checksum || ''
        } catch (uploadError) {
          const error = uploadError as { message?: string }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to upload file: ${error.message || 'Unknown error'}`,
          })
        }

        // Create document record with oauth_app_id
        const { data: document, error: documentError } = await supabase
          .schema('core')
          .from('organization_documents')
          .insert({
            organization_id: input.organizationId,
            folder_id: input.folderId || null,
            name: input.name,
            description: input.description || null,
            category: input.category,
            tags: input.tags,
            is_template: input.isTemplate,
            template_variables: input.templateVariables,
            storage_bucket: 'organization-documents',
            storage_prefix: `org/${input.organizationId}/docs`,
            created_by: user.id,
            oauth_app_id: oauthAppId, // Track which OAuth app created this document
            metadata: {
              original_filename: input.fileName,
            },
          })
          .select()
          .single()

        if (documentError) {
          // Clean up uploaded file if document creation fails
          try {
            await backend.delete(storagePath)
          } catch (cleanupError) {
            console.error('[documents.upload] Failed to cleanup file after document creation error:', cleanupError)
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create document record: ${documentError.message}`,
          })
        }

        // Create initial version
        const { data: version, error: versionError } = await supabase
          .schema('core')
          .from('organization_document_versions')
          .insert({
            document_id: document.id,
            organization_id: input.organizationId,
            storage_object_path: storagePath,
            size_bytes: input.fileSize,
            mime_type: input.contentType,
            checksum: checksum,
            uploaded_by: user.id,
            oauth_app_id: oauthAppId, // Track which OAuth app uploaded this version
            notes: oauthAppId ? `Uploaded via ${oauthAppId}` : 'Initial upload',
          })
          .select()
          .single()

        if (versionError) {
          // Clean up if version creation fails
          await supabase.schema('core').from('organization_documents').delete().eq('id', document.id)
          try {
            await backend.delete(storagePath)
          } catch (cleanupError) {
            console.error('[documents.upload] Failed to cleanup file after version creation error:', cleanupError)
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create document version: ${versionError.message}`,
          })
        }

        // Get signed URL for download (1 hour expiry)
        let downloadUrl: string | null = null
        try {
          const signedUrlResult = await backend.getSignedUrl(storagePath, 3600)
          downloadUrl = signedUrlResult.url
        } catch (urlError) {
          console.warn('[documents.upload] Failed to generate signed URL:', urlError)
        }

        return {
          id: document.id,
          name: document.name,
          category: document.category,
          storageBackend: actualBackend as StorageBackendType,
          storagePath: storagePath,
          downloadUrl,
          oauthAppId: oauthAppId,
          version: version.version_number,
          fileSize: input.fileSize,
          mimeType: input.contentType,
          checksum: checksum,
          createdAt: document.created_at,
          uploadedBy: user.id,
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Get a single document by ID
   * Returns document metadata with signed download URL
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      const { data: document, error } = await supabase
        .schema('core')
        .from('organization_documents')
        .select(
          `
          *,
          latest_version:organization_document_versions!latest_version_id(
            id,
            version_number,
            storage_object_path,
            size_bytes,
            mime_type,
            checksum,
            uploaded_by,
            notes,
            created_at
          ),
          created_by_user:users!created_by(
            id,
            first_name,
            last_name,
            email
          ),
          folder:organization_folders!folder_id(
            id,
            name
          )
        `
        )
        .eq('id', input.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Document not found',
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch document: ${error.message}`,
        })
      }

      // Generate signed URL if we have a storage path
      let downloadUrl: string | null = null
      const version = document.latest_version as { storage_object_path?: string } | null
      if (version?.storage_object_path) {
        const { data: signedUrlData } = await supabase.storage
          .from('organization-documents')
          .createSignedUrl(version.storage_object_path, 3600)
        downloadUrl = signedUrlData?.signedUrl || null
      }

      return {
        ...document,
        downloadUrl,
        oauthAppId: (document as { oauth_app_id?: string | null }).oauth_app_id || null,
      }
    }),

  /**
   * List documents with filtering and pagination
   */
  list: protectedProcedure.input(DocumentListInputSchema).query(async ({ ctx, input }) => {
    const { supabase } = ctx

    let query = supabase
      .schema('core')
      .from('organization_documents')
      .select(
        `
        id,
        name,
        description,
        category,
        tags,
        is_template,
        version_count,
        latest_version_number,
        latest_size_bytes,
        latest_mime_type,
        oauth_app_id,
        created_at,
        updated_at,
        folder:organization_folders!folder_id(id, name),
        created_by_user:users!created_by(id, first_name, last_name),
        metadata
      `,
        { count: 'exact' }
      )
      .eq('organization_id', input.organizationId)

    // Apply filters
    if (!input.includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    if (input.folderId !== undefined) {
      query = input.folderId === null ? query.is('folder_id', null) : query.eq('folder_id', input.folderId)
    }

    if (input.category) {
      query = query.eq('category', input.category)
    }

    if (input.isTemplate !== undefined) {
      query = query.eq('is_template', input.isTemplate)
    }

    if (input.tags && input.tags.length > 0) {
      query = query.overlaps('tags', input.tags)
    }

    if (input.oauthAppId) {
      query = query.eq('oauth_app_id', input.oauthAppId)
    }

    if (input.search) {
      query = query.ilike('name', `%${input.search}%`)
    }

    // Apply sorting
    const sortColumn =
      input.sortBy === 'createdAt'
        ? 'created_at'
        : input.sortBy === 'updatedAt'
          ? 'updated_at'
          : input.sortBy === 'latestSizeBytes'
            ? 'latest_size_bytes'
            : 'name'

    query = query.order(sortColumn, { ascending: input.sortOrder === 'asc' })

    // Apply pagination
    const offset = (input.page - 1) * input.limit
    query = query.range(offset, offset + input.limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to list documents: ${error.message}`,
      })
    }

    const documents = (data || []).map((doc) => ({
      ...doc,
      oauthAppId: (doc as { oauth_app_id?: string | null }).oauth_app_id || null,
    }))

    return {
      documents,
      pagination: {
        page: input.page,
        limit: input.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / input.limit),
      },
    }
  }),

  /**
   * Update document metadata
   */
  update: protectedProcedure.input(DocumentUpdateInputSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    const { id, ...updates } = input

    // Build update object with snake_case keys
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }

    if (updates.name !== undefined) {
      updateData.name = updates.name
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category
    }
    if (updates.tags !== undefined) {
      updateData.tags = updates.tags
    }
    if (updates.folderId !== undefined) {
      updateData.folder_id = updates.folderId
    }
    if (updates.isTemplate !== undefined) {
      updateData.is_template = updates.isTemplate
    }
    if (updates.templateVariables !== undefined) {
      updateData.template_variables = updates.templateVariables
    }

    const { data, error } = await supabase
      .schema('core')
      .from('organization_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        })
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update document: ${error.message}`,
      })
    }

    return {
      ...data,
      oauthAppId: (data as { oauth_app_id?: string | null }).oauth_app_id || null,
    }
  }),

  /**
   * Delete a document (soft delete)
   */
  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('organization_documents')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        })
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to delete document: ${error.message}`,
      })
    }

    return { success: true, deletedDocument: data }
  }),

  /**
   * Get document versions
   */
  getVersions: protectedProcedure.input(z.object({ documentId: z.string().uuid() })).query(async ({ ctx, input }) => {
    const { supabase } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('organization_document_versions')
      .select(
        `
        id,
        version_number,
        storage_object_path,
        size_bytes,
        mime_type,
        checksum,
        notes,
        created_at,
        uploaded_by_user:users!uploaded_by(id, first_name, last_name, email)
      `
      )
      .eq('document_id', input.documentId)
      .order('version_number', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch document versions: ${error.message}`,
      })
    }

    return { versions: data || [] }
  }),

  /**
   * Upload a new version of an existing document
   */
  uploadVersion: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
        file: z.string(), // base64 encoded
        fileName: z.string(),
        contentType: z.string(),
        fileSize: z.number().positive(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const oauthAppId = (ctx as { oauthAppId?: string }).oauthAppId || null

      // First verify document exists and user has access
      const { data: document, error: docError } = await supabase
        .schema('core')
        .from('organization_documents')
        .select('id, organization_id, storage_prefix')
        .eq('id', input.documentId)
        .single()

      if (docError || !document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        })
      }

      try {
        // Convert base64 to Uint8Array
        const base64Data = input.file.includes(',') ? input.file.split(',')[1] : input.file
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Generate storage path for new version
        const timestamp = Date.now()
        const storagePath = `${document.storage_prefix}/${input.documentId}/v-${timestamp}-${input.fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage.from('organization-documents').upload(storagePath, bytes, {
          contentType: input.contentType,
          upsert: false,
        })

        if (uploadError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to upload file: ${uploadError.message}`,
          })
        }

        // Calculate checksum
        const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

        // Create version record (trigger will auto-increment version_number and update parent)
        const { data: version, error: versionError } = await supabase
          .schema('core')
          .from('organization_document_versions')
          .insert({
            document_id: input.documentId,
            organization_id: document.organization_id,
            storage_object_path: storagePath,
            size_bytes: input.fileSize,
            mime_type: input.contentType,
            checksum: checksum,
            uploaded_by: user.id,
            notes: input.notes || (oauthAppId ? `Uploaded via ${oauthAppId}` : 'New version'),
          })
          .select()
          .single()

        if (versionError) {
          await supabase.storage.from('organization-documents').remove([storagePath])
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create version: ${versionError.message}`,
          })
        }

        // Get signed URL
        const { data: signedUrlData } = await supabase.storage
          .from('organization-documents')
          .createSignedUrl(storagePath, 3600)

        return {
          versionId: version.id,
          versionNumber: version.version_number,
          downloadUrl: signedUrlData?.signedUrl || null,
          checksum: checksum,
          createdAt: version.created_at,
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to upload version: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Get signed download URL for a specific version
   */
  getDownloadUrl: protectedProcedure
    .input(
      z.object({
        documentId: z.string().uuid(),
        versionId: z.string().uuid().optional(), // If not provided, uses latest version
        expiresIn: z.number().int().positive().max(86400).optional().default(3600), // Max 24 hours
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      // Get the version (latest or specific)
      let storagePath: string | undefined

      if (input.versionId) {
        const { data: version, error } = await supabase
          .schema('core')
          .from('organization_document_versions')
          .select('storage_object_path')
          .eq('id', input.versionId)
          .eq('document_id', input.documentId)
          .single()

        if (error || !version) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Version not found',
          })
        }
        storagePath = version.storage_object_path
      } else {
        // Get latest version from document
        const { data: document, error } = await supabase
          .schema('core')
          .from('organization_documents')
          .select(
            `
            latest_version:organization_document_versions!latest_version_id(storage_object_path)
          `
          )
          .eq('id', input.documentId)
          .single()

        if (error || !document) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Document not found',
          })
        }

        const latestVersion = document.latest_version as { storage_object_path?: string } | null
        storagePath = latestVersion?.storage_object_path
      }

      if (!storagePath) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No file found for this document',
        })
      }

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('organization-documents')
        .createSignedUrl(storagePath, input.expiresIn)

      if (urlError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to generate download URL: ${urlError.message}`,
        })
      }

      return {
        downloadUrl: signedUrlData?.signedUrl || null,
        expiresIn: input.expiresIn,
      }
    }),

  // ============================================
  // Storage Preference Endpoints
  // ============================================

  /**
   * Get current user's storage preference
   */
  getStoragePreference: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('users')
      .select('storage_preference')
      .eq('id', user.id)
      .single()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to get storage preference: ${error.message}`,
      })
    }

    return {
      storagePreference: (data?.storage_preference as StorageBackendType) || 'supabase',
    }
  }),

  /**
   * Update current user's storage preference
   */
  setStoragePreference: protectedProcedure
    .input(
      z.object({
        storagePreference: z.enum(['supabase', 'dropbox', 'google_drive']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { error } = await supabase
        .schema('core')
        .from('users')
        .update({ storage_preference: input.storagePreference })
        .eq('id', user.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update storage preference: ${error.message}`,
        })
      }

      // Clear the storage router cache for this user
      const storageRouter = createStorageRouter(supabase, user.id)
      storageRouter.clearCache()

      return {
        storagePreference: input.storagePreference,
        message: 'Storage preference updated successfully',
      }
    }),

  // ============================================
  // Batch Upload & Performance Endpoints
  // ============================================

  /**
   * Batch upload multiple documents
   * Processes up to 10 documents concurrently using the upload queue
   */
  batchUpload: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        folderId: z.string().uuid().optional().nullable(),
        category: DocumentCategorySchema.optional().default('general'),
        documents: z
          .array(
            z.object({
              name: z.string().min(1).max(255),
              description: z.string().optional().nullable(),
              tags: z.array(z.string()).optional().default([]),
              file: z.string(), // base64 encoded
              fileName: z.string(),
              contentType: z.string(),
              fileSize: z.number().positive(),
            })
          )
          .min(1)
          .max(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const oauthAppId = (ctx as { oauthAppId?: string }).oauthAppId || null
      const performanceMonitor = getPerformanceMonitor()
      const startTime = performance.now()

      // Get storage backend
      const storageRouter = createStorageRouter(supabase, user.id)
      const { backend, actualBackend } = await storageRouter.getBackend()

      // Create upload handler
      const uploadHandler = async (task: UploadTask): Promise<{ path: string; checksum?: string }> => {
        const uploadResult = await backend.upload(task.file, task.path, {
          contentType: task.contentType,
        })
        return { path: uploadResult.path, checksum: uploadResult.checksum }
      }

      // Create upload queue with concurrency of 5
      const queue = createUploadQueue(uploadHandler, {
        concurrency: 5,
        maxRetries: 3,
        onTaskComplete: (result) => {
          performanceMonitor.recordUpload(
            'documents.batchUpload',
            result.duration,
            0, // We don't have byte count here, but could add it
            result.success,
            result.error
          )
        },
      })

      const results: Array<{
        name: string
        success: boolean
        documentId?: string
        error?: string
      }> = []

      // Process each document
      for (const doc of input.documents) {
        try {
          // Convert base64 to Uint8Array
          const base64Data = doc.file.includes(',') ? doc.file.split(',')[1] : doc.file
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          // Generate storage path
          const timestamp = Date.now()
          const storagePath = `org/${input.organizationId}/docs/${timestamp}-${doc.fileName}`

          // Queue the upload
          const uploadResult = await queue.enqueue({
            file: bytes,
            path: storagePath,
            contentType: doc.contentType,
          })

          if (!uploadResult.success) {
            results.push({
              name: doc.name,
              success: false,
              error: uploadResult.error || 'Upload failed',
            })
            continue
          }

          // Create document record
          const { data: document, error: documentError } = await supabase
            .schema('core')
            .from('organization_documents')
            .insert({
              organization_id: input.organizationId,
              folder_id: input.folderId || null,
              name: doc.name,
              description: doc.description || null,
              category: input.category,
              tags: doc.tags,
              is_template: false,
              storage_bucket: 'organization-documents',
              storage_prefix: `org/${input.organizationId}/docs`,
              created_by: user.id,
              oauth_app_id: oauthAppId,
              metadata: { original_filename: doc.fileName },
            })
            .select()
            .single()

          if (documentError) {
            results.push({
              name: doc.name,
              success: false,
              error: `Database error: ${documentError.message}`,
            })
            continue
          }

          // Create initial version
          const { error: versionError } = await supabase
            .schema('core')
            .from('organization_document_versions')
            .insert({
              document_id: document.id,
              organization_id: input.organizationId,
              storage_object_path: storagePath,
              size_bytes: doc.fileSize,
              mime_type: doc.contentType,
              checksum: '',
              uploaded_by: user.id,
              oauth_app_id: oauthAppId,
              notes: 'Batch upload',
            })

          if (versionError) {
            results.push({
              name: doc.name,
              success: false,
              error: `Version error: ${versionError.message}`,
            })
            continue
          }

          results.push({
            name: doc.name,
            success: true,
            documentId: document.id,
          })
        } catch (error) {
          results.push({
            name: doc.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      const totalDuration = Math.round(performance.now() - startTime)
      const totalBytes = input.documents.reduce((sum, doc) => sum + doc.fileSize, 0)

      // Record overall batch performance
      performanceMonitor.recordUpload(
        'documents.batchUpload.total',
        totalDuration,
        totalBytes,
        results.every((r) => r.success)
      )

      return {
        results,
        summary: {
          total: input.documents.length,
          successful: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
          durationMs: totalDuration,
          throughputMBps: totalBytes / 1024 / 1024 / (totalDuration / 1000),
          storageBackend: actualBackend,
        },
        queueMetrics: queue.getMetrics(),
      }
    }),

  /**
   * Get performance metrics for document operations
   */
  getPerformanceMetrics: protectedProcedure.query(async () => {
    const performanceMonitor = getPerformanceMonitor()
    const cache = getDocumentCache()

    return {
      performance: performanceMonitor.getSnapshot(),
      cache: cache.getMetrics(),
      slowQueries: performanceMonitor.getSlowQueries().slice(0, 10), // Last 10 slow queries
    }
  }),

  /**
   * Get cache statistics
   */
  getCacheStats: protectedProcedure.query(async () => {
    const cache = getDocumentCache()
    return cache.getMetrics()
  }),

  /**
   * Clear document cache (admin operation)
   */
  clearCache: protectedProcedure.mutation(async () => {
    const cache = getDocumentCache()
    cache.clear()
    cache.resetMetrics()
    return { success: true, message: 'Document cache cleared' }
  }),
})
