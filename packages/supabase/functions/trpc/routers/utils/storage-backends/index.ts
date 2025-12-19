/**
 * Storage Backend Interface and Types
 *
 * Defines the contract for storage backends (Supabase, Dropbox, Google Drive)
 * All backends must implement IStorageBackend interface
 */

export type StorageBackendType = 'supabase' | 'dropbox' | 'google_drive'

export interface UploadOptions {
  contentType: string
  metadata?: Record<string, string>
  upsert?: boolean
}

export interface UploadResult {
  path: string
  storageBackend: StorageBackendType
  size: number
  checksum?: string
}

export interface SignedUrlResult {
  url: string
  expiresAt: Date
}

export interface StorageError {
  code: 'UPLOAD_FAILED' | 'DELETE_FAILED' | 'URL_GENERATION_FAILED' | 'QUOTA_EXCEEDED' | 'UNAUTHORIZED' | 'NOT_FOUND'
  message: string
  originalError?: unknown
}

/**
 * Storage Backend Interface
 * All storage backends must implement this interface
 */
export interface IStorageBackend {
  /**
   * The type of storage backend
   */
  readonly type: StorageBackendType

  /**
   * Upload a file to the storage backend
   * @param file - File data as Uint8Array
   * @param path - Storage path (e.g., "org/{orgId}/docs/{filename}")
   * @param options - Upload options including content type
   * @returns Upload result with storage path and backend type
   */
  upload(file: Uint8Array, path: string, options: UploadOptions): Promise<UploadResult>

  /**
   * Delete a file from the storage backend
   * @param path - Storage path to delete
   */
  delete(path: string): Promise<void>

  /**
   * Generate a signed URL for file download
   * @param path - Storage path
   * @param expirySeconds - URL expiry time in seconds
   * @returns Signed URL result with expiry timestamp
   */
  getSignedUrl(path: string, expirySeconds: number): Promise<SignedUrlResult>

  /**
   * Check if the storage backend is available and configured
   * @returns True if backend is ready to use
   */
  isAvailable(): Promise<boolean>
}

/**
 * Result type for storage router operations
 */
export interface StorageRouterResult {
  backend: IStorageBackend
  usedFallback: boolean
  preferredBackend: StorageBackendType
  actualBackend: StorageBackendType
}

export { SupabaseStorageBackend } from './supabase-backend.ts'
export { DropboxStorageBackend } from './dropbox-backend.ts'
export { GoogleDriveStorageBackend } from './google-drive-backend.ts'
