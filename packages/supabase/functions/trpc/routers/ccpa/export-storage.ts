/**
 * CCPA Export Storage Service
 *
 * Handles secure storage and delivery of CCPA data exports:
 * - Upload encrypted exports to storage (Supabase Storage or S3)
 * - Generate time-limited signed URLs for download
 * - Track download counts and enforce limits
 * - Automatic cleanup of expired exports
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../_shared/database.types.ts'

type DbClient = SupabaseClient<Database>

// ========================================================
// CONFIGURATION
// ========================================================

/**
 * Export storage configuration
 */
export const EXPORT_CONFIG = {
  /** Storage bucket name */
  BUCKET_NAME: 'ccpa-exports',

  /** Path prefix for exports */
  PATH_PREFIX: 'exports/',

  /** Default URL expiry in seconds (24 hours) */
  URL_EXPIRY_SECONDS: 24 * 60 * 60,

  /** Maximum downloads per export */
  MAX_DOWNLOADS: 3,

  /** Default export retention in hours */
  RETENTION_HOURS: 24,

  /** Supported file formats */
  SUPPORTED_FORMATS: ['pdf', 'json', 'csv'] as const,
} as const

export type ExportFormat = (typeof EXPORT_CONFIG.SUPPORTED_FORMATS)[number]

// ========================================================
// TYPES
// ========================================================

/**
 * Upload result
 */
export interface UploadResult {
  success: boolean
  storageKey: string | null
  storagePath: string | null
  uploadedAt: string
  sizeBytes: number
  error?: string
}

/**
 * Signed URL result
 */
export interface SignedUrlResult {
  success: boolean
  url: string | null
  expiresAt: string
  error?: string
}

/**
 * Download record
 */
export interface DownloadRecord {
  id: string
  requestId: string
  storageKey: string
  signedUrl: string | null
  expiresAt: string
  downloadCount: number
  maxDownloads: number
  firstDownloadedAt: string | null
  lastDownloadedAt: string | null
  fileFormat: ExportFormat
  fileSizeBytes: number
  createdAt: string
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  success: boolean
  filesDeleted: number
  recordsDeleted: number
  errors: Array<{ key: string; error: string }>
}

// ========================================================
// STORAGE KEY GENERATION
// ========================================================

/**
 * Generate a unique storage key for an export
 */
export function generateStorageKey(
  userId: string,
  requestId: string,
  format: ExportFormat
): string {
  const timestamp = Date.now()
  return `${EXPORT_CONFIG.PATH_PREFIX}${userId}/${requestId}/${timestamp}.${format}`
}

/**
 * Parse a storage key to extract components
 */
export function parseStorageKey(storageKey: string): {
  userId: string
  requestId: string
  timestamp: number
  format: ExportFormat
} | null {
  const regex = new RegExp(
    `^${EXPORT_CONFIG.PATH_PREFIX}([^/]+)/([^/]+)/(\\d+)\\.(${EXPORT_CONFIG.SUPPORTED_FORMATS.join('|')})$`
  )
  const match = storageKey.match(regex)

  if (!match) return null

  return {
    userId: match[1],
    requestId: match[2],
    timestamp: parseInt(match[3], 10),
    format: match[4] as ExportFormat,
  }
}

// ========================================================
// UPLOAD FUNCTIONS
// ========================================================

/**
 * Upload export file to storage
 *
 * Uses Supabase Storage for secure file hosting.
 * In production, this can be swapped for S3 with minimal changes.
 */
export async function uploadExportToStorage(
  supabase: DbClient,
  requestId: string,
  userId: string,
  data: Uint8Array,
  format: ExportFormat
): Promise<UploadResult> {
  const uploadedAt = new Date().toISOString()

  try {
    const storageKey = generateStorageKey(userId, requestId, format)

    // Get appropriate content type
    const contentType = getContentType(format)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(EXPORT_CONFIG.BUCKET_NAME)
      .upload(storageKey, data, {
        contentType,
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      })

    if (uploadError) {
      console.error('[export-storage] Upload failed:', uploadError)
      return {
        success: false,
        storageKey: null,
        storagePath: null,
        uploadedAt,
        sizeBytes: 0,
        error: uploadError.message,
      }
    }

    console.log(`[export-storage] Uploaded export: ${storageKey} (${data.length} bytes)`)

    return {
      success: true,
      storageKey,
      storagePath: uploadData.path,
      uploadedAt,
      sizeBytes: data.length,
    }
  } catch (error) {
    console.error('[export-storage] Upload error:', error)
    return {
      success: false,
      storageKey: null,
      storagePath: null,
      uploadedAt,
      sizeBytes: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get content type for file format
 */
function getContentType(format: ExportFormat): string {
  switch (format) {
    case 'pdf':
      return 'application/pdf'
    case 'json':
      return 'application/json'
    case 'csv':
      return 'text/csv'
    default:
      return 'application/octet-stream'
  }
}

// ========================================================
// SIGNED URL GENERATION
// ========================================================

/**
 * Generate a signed URL for downloading an export
 */
export async function generateSignedDownloadUrl(
  supabase: DbClient,
  storageKey: string,
  expirySeconds: number = EXPORT_CONFIG.URL_EXPIRY_SECONDS
): Promise<SignedUrlResult> {
  const expiresAt = new Date(Date.now() + expirySeconds * 1000).toISOString()

  try {
    const { data, error } = await supabase.storage
      .from(EXPORT_CONFIG.BUCKET_NAME)
      .createSignedUrl(storageKey, expirySeconds)

    if (error || !data?.signedUrl) {
      console.error('[export-storage] Signed URL generation failed:', error)
      return {
        success: false,
        url: null,
        expiresAt,
        error: error?.message ?? 'Failed to generate signed URL',
      }
    }

    return {
      success: true,
      url: data.signedUrl,
      expiresAt,
    }
  } catch (error) {
    console.error('[export-storage] Signed URL error:', error)
    return {
      success: false,
      url: null,
      expiresAt,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ========================================================
// DOWNLOAD TRACKING
// ========================================================

/**
 * Create a download record for tracking
 */
export async function createDownloadRecord(
  supabase: DbClient,
  requestId: string,
  storageKey: string,
  signedUrl: string | null,
  expiresAt: string,
  format: ExportFormat,
  sizeBytes: number
): Promise<{ success: boolean; recordId: string | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .schema('core')
      .from('ccpa_export_downloads')
      .insert({
        request_id: requestId,
        storage_key: storageKey,
        signed_url: signedUrl,
        expires_at: expiresAt,
        download_count: 0,
        max_downloads: EXPORT_CONFIG.MAX_DOWNLOADS,
        file_format: format,
        file_size_bytes: sizeBytes,
        // biome-ignore lint/suspicious/noExplicitAny: Table schema mismatch
      } as any)
      .select('id')
      .single()

    if (error) {
      console.error('[export-storage] Create download record failed:', error)
      return {
        success: false,
        recordId: null,
        error: error.message,
      }
    }

    return {
      success: true,
      recordId: data.id,
    }
  } catch (error) {
    console.error('[export-storage] Create download record error:', error)
    return {
      success: false,
      recordId: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Track a download and enforce limits
 */
export async function trackDownload(
  supabase: DbClient,
  requestId: string
): Promise<{
  success: boolean
  downloadCount: number
  remaining: number
  error?: string
}> {
  try {
    // Get current download record
    const { data: record, error: fetchError } = await supabase
      .schema('core')
      .from('ccpa_export_downloads')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (fetchError || !record) {
      return {
        success: false,
        downloadCount: 0,
        remaining: 0,
        error: 'Download record not found',
      }
    }

    // Check download limit
    if (record.download_count >= record.max_downloads) {
      return {
        success: false,
        downloadCount: record.download_count,
        remaining: 0,
        error: 'Maximum download limit reached',
      }
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return {
        success: false,
        downloadCount: record.download_count,
        remaining: 0,
        error: 'Export has expired',
      }
    }

    // Update download count
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .schema('core')
      .from('ccpa_export_downloads')
      .update({
        download_count: record.download_count + 1,
        first_downloaded_at: record.first_downloaded_at ?? now,
        last_downloaded_at: now,
      })
      .eq('id', record.id)

    if (updateError) {
      console.error('[export-storage] Update download count failed:', updateError)
      // Don't block download on tracking failure
    }

    return {
      success: true,
      downloadCount: record.download_count + 1,
      remaining: record.max_downloads - (record.download_count + 1),
    }
  } catch (error) {
    console.error('[export-storage] Track download error:', error)
    return {
      success: false,
      downloadCount: 0,
      remaining: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get download record for a request
 */
export async function getDownloadRecord(
  supabase: DbClient,
  requestId: string
): Promise<DownloadRecord | null> {
  try {
    const { data, error } = await supabase
      .schema('core')
      .from('ccpa_export_downloads')
      .select('*')
      .eq('request_id', requestId)
      .single()

    if (error || !data) {
      return null
    }

    // biome-ignore lint/suspicious/noExplicitAny: Table schema mismatch
    const record = data as any
    return {
      id: record.id,
      requestId: record.request_id,
      storageKey: record.storage_key,
      signedUrl: record.signed_url,
      expiresAt: record.expires_at,
      downloadCount: record.download_count,
      maxDownloads: record.max_downloads,
      firstDownloadedAt: record.first_downloaded_at,
      lastDownloadedAt: record.last_downloaded_at,
      fileFormat: record.file_format as ExportFormat,
      fileSizeBytes: record.file_size_bytes ?? 0,
      createdAt: record.created_at,
    }
  } catch (error) {
    console.error('[export-storage] Get download record error:', error)
    return null
  }
}

// ========================================================
// CLEANUP FUNCTIONS
// ========================================================

/**
 * Clean up expired exports
 *
 * Deletes files from storage and removes tracking records.
 * Should be run periodically (e.g., daily cron job).
 */
export async function cleanupExpiredExports(supabase: DbClient): Promise<CleanupResult> {
  const errors: Array<{ key: string; error: string }> = []
  let filesDeleted = 0
  let recordsDeleted = 0

  try {
    // Find expired records
    const { data: expiredRecords, error: queryError } = await supabase
      .schema('core')
      .from('ccpa_export_downloads')
      .select('id, storage_key')
      .lt('expires_at', new Date().toISOString())

    if (queryError) {
      console.error('[export-storage] Query expired records failed:', queryError)
      return {
        success: false,
        filesDeleted: 0,
        recordsDeleted: 0,
        errors: [{ key: 'query', error: queryError.message }],
      }
    }

    if (!expiredRecords || expiredRecords.length === 0) {
      console.log('[export-storage] No expired exports to clean up')
      return {
        success: true,
        filesDeleted: 0,
        recordsDeleted: 0,
        errors: [],
      }
    }

    console.log(`[export-storage] Found ${expiredRecords.length} expired exports to clean up`)

    // Delete files from storage
    // biome-ignore lint/suspicious/noExplicitAny: Table schema mismatch
    const storageKeys = expiredRecords.map((r: any) => r.storage_key)
    const { error: deleteError } = await supabase.storage
      .from(EXPORT_CONFIG.BUCKET_NAME)
      .remove(storageKeys)

    if (deleteError) {
      console.error('[export-storage] Batch delete failed:', deleteError)
      errors.push({ key: 'batch_delete', error: deleteError.message })
    } else {
      filesDeleted = storageKeys.length
    }

    // Delete tracking records
    // biome-ignore lint/suspicious/noExplicitAny: Table schema mismatch
    const recordIds = expiredRecords.map((r: any) => r.id)
    const { error: recordDeleteError } = await supabase
      .schema('core')
      .from('ccpa_export_downloads')
      .delete()
      .in('id', recordIds)

    if (recordDeleteError) {
      console.error('[export-storage] Delete records failed:', recordDeleteError)
      errors.push({ key: 'records_delete', error: recordDeleteError.message })
    } else {
      recordsDeleted = recordIds.length
    }

    console.log(
      `[export-storage] Cleanup complete: ${filesDeleted} files, ${recordsDeleted} records deleted`
    )

    return {
      success: errors.length === 0,
      filesDeleted,
      recordsDeleted,
      errors,
    }
  } catch (error) {
    console.error('[export-storage] Cleanup error:', error)
    return {
      success: false,
      filesDeleted,
      recordsDeleted,
      errors: [{ key: 'cleanup', error: error instanceof Error ? error.message : 'Unknown error' }],
    }
  }
}

/**
 * Delete a specific export file
 */
export async function deleteExportFile(
  supabase: DbClient,
  storageKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(EXPORT_CONFIG.BUCKET_NAME).remove([storageKey])

    if (error) {
      console.error('[export-storage] Delete file failed:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[export-storage] Delete file error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ========================================================
// COMPLETE EXPORT WORKFLOW
// ========================================================

/**
 * Complete export workflow: upload, track, and prepare for download
 *
 * This is the main function for creating a downloadable export.
 */
export async function createExportDownload(
  supabase: DbClient,
  requestId: string,
  userId: string,
  data: Uint8Array,
  format: ExportFormat
): Promise<{
  success: boolean
  downloadUrl: string | null
  expiresAt: string | null
  fileName: string | null
  error?: string
}> {
  // 1. Upload to storage
  const uploadResult = await uploadExportToStorage(supabase, requestId, userId, data, format)

  if (!uploadResult.success || !uploadResult.storageKey) {
    return {
      success: false,
      downloadUrl: null,
      expiresAt: null,
      fileName: null,
      error: uploadResult.error ?? 'Upload failed',
    }
  }

  // 2. Generate signed URL
  const signedUrlResult = await generateSignedDownloadUrl(supabase, uploadResult.storageKey)

  if (!signedUrlResult.success || !signedUrlResult.url) {
    // Clean up uploaded file on failure
    await deleteExportFile(supabase, uploadResult.storageKey)
    return {
      success: false,
      downloadUrl: null,
      expiresAt: null,
      fileName: null,
      error: signedUrlResult.error ?? 'Signed URL generation failed',
    }
  }

  // 3. Create download tracking record
  const trackingResult = await createDownloadRecord(
    supabase,
    requestId,
    uploadResult.storageKey,
    signedUrlResult.url,
    signedUrlResult.expiresAt,
    format,
    uploadResult.sizeBytes
  )

  if (!trackingResult.success) {
    console.warn('[export-storage] Failed to create tracking record:', trackingResult.error)
    // Continue anyway - download tracking is non-critical
  }

  // Generate filename
  const parsed = parseStorageKey(uploadResult.storageKey)
  const fileName = parsed
    ? `ccpa-export-${requestId.slice(0, 8)}.${format}`
    : `ccpa-export.${format}`

  return {
    success: true,
    downloadUrl: signedUrlResult.url,
    expiresAt: signedUrlResult.expiresAt,
    fileName,
  }
}
