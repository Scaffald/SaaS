/**
 * Dropbox Storage Backend
 *
 * Storage backend that stores documents in the user's Dropbox account.
 * Requires OAuth2 authentication to access user's Dropbox.
 *
 * NOTE: Placeholder implementation for Phase 3.
 * Full implementation requires:
 * 1. Dropbox OAuth2 integration (App Key, App Secret)
 * 2. Token storage and refresh logic
 * 3. Dropbox API calls for file operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { IStorageBackend, SignedUrlResult, UploadOptions, UploadResult } from './index.ts'

// Dropbox API endpoints
const DROPBOX_API_BASE = 'https://api.dropboxapi.com/2'
const DROPBOX_CONTENT_BASE = 'https://content.dropboxapi.com/2'

export class DropboxStorageBackend implements IStorageBackend {
  readonly type = 'dropbox' as const
  private readonly supabase: SupabaseClient
  private readonly userId: string
  private accessToken: string | null = null

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase
    this.userId = userId
  }

  /**
   * Load the user's Dropbox access token from the database
   */
  private async loadAccessToken(): Promise<string | null> {
    const { data, error } = await this.supabase
      .schema('core')
      .from('cloud_storage_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', this.userId)
      .eq('provider', 'dropbox')
      .single()

    if (error || !data) {
      console.warn('[DropboxBackend] No Dropbox token found for user:', this.userId)
      return null
    }

    // Check if token is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.log('[DropboxBackend] Token expired, attempting refresh')
      const refreshedToken = await this.refreshToken(data.refresh_token)
      if (refreshedToken) {
        return refreshedToken
      }
      return null
    }

    return data.access_token
  }

  /**
   * Refresh an expired Dropbox token
   * Note: This requires the DROPBOX_APP_KEY and DROPBOX_APP_SECRET environment variables
   */
  private async refreshToken(_refreshToken: string): Promise<string | null> {
    // TODO: Implement token refresh with Dropbox OAuth
    // This requires:
    // 1. DROPBOX_APP_KEY and DROPBOX_APP_SECRET environment variables
    // 2. POST to https://api.dropboxapi.com/oauth2/token with:
    //    - grant_type: refresh_token
    //    - refresh_token: refreshToken
    //    - client_id: DROPBOX_APP_KEY
    //    - client_secret: DROPBOX_APP_SECRET
    console.warn('[DropboxBackend] Token refresh not yet implemented')
    return null
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureToken(): Promise<string> {
    if (!this.accessToken) {
      this.accessToken = await this.loadAccessToken()
    }

    if (!this.accessToken) {
      throw {
        code: 'UNAUTHORIZED',
        message: 'Dropbox not connected. Please connect your Dropbox account in settings.',
      }
    }

    return this.accessToken
  }

  async upload(file: Uint8Array, path: string, _options: UploadOptions): Promise<UploadResult> {
    const token = await this.ensureToken()

    // Normalize path for Dropbox (must start with /)
    const dropboxPath = path.startsWith('/') ? path : `/${path}`

    try {
      const response = await fetch(`${DROPBOX_CONTENT_BASE}/files/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: `/Scaffald${dropboxPath}`,
            mode: 'add',
            autorename: true,
            mute: false,
          }),
        },
        // biome-ignore lint/suspicious/noExplicitAny: Uint8Array to BodyInit conversion
        body: file as any,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw {
          code: 'UPLOAD_FAILED',
          message: `Dropbox upload failed: ${errorText}`,
        }
      }

      const result = (await response.json()) as {
        path_display: string
        size: number
        content_hash: string
      }

      return {
        path: result.path_display,
        storageBackend: 'dropbox',
        size: result.size,
        checksum: result.content_hash,
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error
      }
      throw {
        code: 'UPLOAD_FAILED',
        message: `Dropbox upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error,
      }
    }
  }

  async delete(path: string): Promise<void> {
    const token = await this.ensureToken()

    try {
      const response = await fetch(`${DROPBOX_API_BASE}/files/delete_v2`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: path.startsWith('/') ? path : `/${path}`,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw {
          code: 'DELETE_FAILED',
          message: `Dropbox delete failed: ${errorText}`,
        }
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error
      }
      throw {
        code: 'DELETE_FAILED',
        message: `Dropbox delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error,
      }
    }
  }

  async getSignedUrl(path: string, expirySeconds: number): Promise<SignedUrlResult> {
    const token = await this.ensureToken()

    try {
      const response = await fetch(`${DROPBOX_API_BASE}/files/get_temporary_link`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: path.startsWith('/') ? path : `/${path}`,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw {
          code: 'URL_GENERATION_FAILED',
          message: `Dropbox link generation failed: ${errorText}`,
        }
      }

      const result = (await response.json()) as { link: string }

      // Dropbox temporary links expire after 4 hours
      const expiresAt = new Date(Date.now() + Math.min(expirySeconds, 4 * 60 * 60) * 1000)

      return {
        url: result.link,
        expiresAt,
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error
      }
      throw {
        code: 'URL_GENERATION_FAILED',
        message: `Dropbox link generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error,
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const token = await this.loadAccessToken()
      if (!token) {
        return false
      }

      // Verify the token is still valid by calling the current account endpoint
      const response = await fetch(`${DROPBOX_API_BASE}/users/get_current_account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return response.ok
    } catch {
      return false
    }
  }
}
