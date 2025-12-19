/**
 * Storage Router
 *
 * Determines which storage backend to use based on user preferences.
 * Supports fallback to Supabase if preferred backend is unavailable.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { IStorageBackend, StorageBackendType, StorageRouterResult } from './storage-backends/index.ts'
import { SupabaseStorageBackend } from './storage-backends/supabase-backend.ts'
import { DropboxStorageBackend } from './storage-backends/dropbox-backend.ts'
import { GoogleDriveStorageBackend } from './storage-backends/google-drive-backend.ts'

// Backend cache to avoid creating new instances for each request
const backendCache = new Map<string, IStorageBackend>()

/**
 * Get cache key for backend instance
 */
function getBackendCacheKey(type: StorageBackendType, userId: string): string {
  return `${type}:${userId}`
}

/**
 * Storage Router class
 * Selects and provides the appropriate storage backend based on user preferences
 */
export class StorageRouter {
  private readonly supabase: SupabaseClient
  private readonly userId: string

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase
    this.userId = userId
  }

  /**
   * Get the storage preference for the current user
   * Defaults to 'supabase' if not set
   */
  async getUserStoragePreference(): Promise<StorageBackendType> {
    const { data, error } = await this.supabase
      .schema('core')
      .from('users')
      .select('storage_preference')
      .eq('id', this.userId)
      .single()

    if (error || !data) {
      console.warn('[StorageRouter] Failed to get user storage preference, defaulting to supabase:', error?.message)
      return 'supabase'
    }

    // Return preference or default to supabase
    return (data.storage_preference as StorageBackendType) || 'supabase'
  }

  /**
   * Get the appropriate storage backend for the user
   * Includes fallback logic if preferred backend is unavailable
   */
  async getBackend(): Promise<StorageRouterResult> {
    const preferredBackend = await this.getUserStoragePreference()

    // Try to get the preferred backend
    const backend = await this.getBackendInstance(preferredBackend)

    // Check if backend is available
    const isAvailable = await backend.isAvailable()

    if (isAvailable) {
      return {
        backend,
        usedFallback: false,
        preferredBackend,
        actualBackend: preferredBackend,
      }
    }

    // If preferred backend is not available and not already Supabase, fallback to Supabase
    if (preferredBackend !== 'supabase') {
      console.warn(
        `[StorageRouter] Preferred backend '${preferredBackend}' unavailable for user ${this.userId}, falling back to Supabase`
      )

      const supabaseBackend = await this.getBackendInstance('supabase')
      return {
        backend: supabaseBackend,
        usedFallback: true,
        preferredBackend,
        actualBackend: 'supabase',
      }
    }

    // Supabase should always be available, but if not, throw error
    throw new Error('Supabase storage backend is not available')
  }

  /**
   * Get a storage backend instance
   * Uses caching to avoid creating new instances
   */
  private async getBackendInstance(type: StorageBackendType): Promise<IStorageBackend> {
    const cacheKey = getBackendCacheKey(type, this.userId)

    // Check cache first
    const cached = backendCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Create new backend instance
    const backend = await this.createBackendInstance(type)
    backendCache.set(cacheKey, backend)

    return backend
  }

  /**
   * Create a new storage backend instance
   */
  private async createBackendInstance(type: StorageBackendType): Promise<IStorageBackend> {
    switch (type) {
      case 'supabase':
        return new SupabaseStorageBackend(this.supabase)

      case 'dropbox':
        // Dropbox backend - requires user to have connected their Dropbox account
        return new DropboxStorageBackend(this.supabase, this.userId)

      case 'google_drive':
        // Google Drive backend - requires user to have connected their Google account
        return new GoogleDriveStorageBackend(this.supabase, this.userId)

      default:
        throw new Error(`Unknown storage backend type: ${type}`)
    }
  }

  /**
   * Clear the backend cache for this user
   * Call this when user changes their storage preference
   */
  clearCache(): void {
    const keys = Array.from(backendCache.keys())
    for (const key of keys) {
      if (key.endsWith(`:${this.userId}`)) {
        backendCache.delete(key)
      }
    }
  }
}

/**
 * Create a StorageRouter instance for a user
 */
export function createStorageRouter(supabase: SupabaseClient, userId: string): StorageRouter {
  return new StorageRouter(supabase, userId)
}
