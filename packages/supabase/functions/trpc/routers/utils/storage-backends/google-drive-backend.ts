/**
 * Google Drive Storage Backend
 *
 * Storage backend that stores documents in the user's Google Drive account.
 * Requires OAuth2 authentication to access user's Google Drive.
 *
 * NOTE: This is a placeholder implementation for Phase 3 (TASK-11).
 * Full implementation requires:
 * 1. Google OAuth2 integration (Client ID, Client Secret)
 * 2. Token storage and refresh logic
 * 3. Google Drive API calls for file operations
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { IStorageBackend, SignedUrlResult, UploadOptions, UploadResult } from './index';

// Google Drive API endpoints
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3'
const GOOGLE_DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export class GoogleDriveStorageBackend implements IStorageBackend {
  readonly type = 'google_drive' as const
  private readonly supabase: SupabaseClient
  private readonly userId: string
  private accessToken: string | null = null
  private scaffaldFolderId: string | null = null

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase
    this.userId = userId
  }

  /**
   * Load the user's Google Drive access token from the database
   */
  private async loadAccessToken(): Promise<string | null> {
    const { data, error } = await this.supabase
      .schema('core')
      .from('cloud_storage_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', this.userId)
      .eq('provider', 'google_drive')
      .single()

    if (error || !data) {
      console.warn('[GoogleDriveBackend] No Google Drive token found for user:', this.userId)
      return null
    }

    // Check if token is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.log('[GoogleDriveBackend] Token expired, attempting refresh')
      const refreshedToken = await this.refreshToken(data.refresh_token)
      if (refreshedToken) {
        return refreshedToken
      }
      return null
    }

    return data.access_token
  }

  /**
   * Refresh an expired Google Drive token
   * Note: This requires the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
   */
  private async refreshToken(refreshToken: string): Promise<string | null> {
    // TODO: Get these from environment variables or secure storage
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      console.warn('[GoogleDriveBackend] Missing Google OAuth credentials')
      return null
    }

    try {
      const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        console.error('[GoogleDriveBackend] Token refresh failed:', await response.text())
        return null
      }

      const tokens = await response.json() as { access_token: string; expires_in: number }

      // Update the token in the database
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
      await this.supabase
        .schema('core')
        .from('cloud_storage_tokens')
        .update({
          access_token: tokens.access_token,
          expires_at: expiresAt.toISOString(),
        })
        .eq('user_id', this.userId)
        .eq('provider', 'google_drive')

      return tokens.access_token
    } catch (error) {
      console.error('[GoogleDriveBackend] Error refreshing token:', error)
      return null
    }
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
        message: 'Google Drive not connected. Please connect your Google account in settings.',
      }
    }

    return this.accessToken
  }

  /**
   * Get or create the Scaffald folder in Google Drive
   */
  private async getScaffaldFolder(token: string): Promise<string> {
    if (this.scaffaldFolderId) {
      return this.scaffaldFolderId
    }

    // Search for existing Scaffald folder
    const searchResponse = await fetch(
      `${GOOGLE_DRIVE_API}/files?q=name='Scaffald' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!searchResponse.ok) {
      throw {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to search for Scaffald folder',
      }
    }

    const searchResult = await searchResponse.json() as { files: Array<{ id: string }> }

    if (searchResult.files && searchResult.files.length > 0) {
      this.scaffaldFolderId = searchResult.files[0].id
      return this.scaffaldFolderId
    }

    // Create the Scaffald folder
    const createResponse = await fetch(`${GOOGLE_DRIVE_API}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Scaffald',
        mimeType: 'application/vnd.google-apps.folder',
      }),
    })

    if (!createResponse.ok) {
      throw {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create Scaffald folder',
      }
    }

    const folder = await createResponse.json() as { id: string }
    this.scaffaldFolderId = folder.id
    return this.scaffaldFolderId
  }

  async upload(file: Uint8Array, path: string, options: UploadOptions): Promise<UploadResult> {
    const token = await this.ensureToken()
    const folderId = await this.getScaffaldFolder(token)

    // Extract filename from path
    const filename = path.split('/').pop() || `file_${Date.now()}`

    try {
      // Use multipart upload for metadata + content
      const boundary = '-------314159265358979323846'
      const delimiter = `\r\n--${boundary}\r\n`
      const closeDelimiter = `\r\n--${boundary}--`

      const metadata = {
        name: filename,
        parents: [folderId],
        mimeType: options.contentType,
      }

      // Create multipart body
      const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`
      const filePart = `${delimiter}Content-Type: ${options.contentType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`

      // Convert file to base64
      const base64Content = btoa(String.fromCharCode(...file))

      const body = metadataPart + filePart + base64Content + closeDelimiter

      const response = await fetch(
        `${GOOGLE_DRIVE_UPLOAD}/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body,
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw {
          code: 'UPLOAD_FAILED',
          message: `Google Drive upload failed: ${errorText}`,
        }
      }

      const result = await response.json() as { id: string; name: string; size: string; md5Checksum: string }

      // Calculate checksum locally if not provided by Google
      const hashBuffer = await crypto.subtle.digest('SHA-256', file)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      return {
        path: result.id, // Google Drive uses file IDs, not paths
        storageBackend: 'google_drive',
        size: parseInt(result.size || '0', 10) || file.length,
        checksum: result.md5Checksum || checksum,
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error
      }
      throw {
        code: 'UPLOAD_FAILED',
        message: `Google Drive upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error,
      }
    }
  }

  async delete(path: string): Promise<void> {
    const token = await this.ensureToken()

    // In Google Drive, path is actually the file ID
    const fileId = path

    try {
      const response = await fetch(`${GOOGLE_DRIVE_API}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text()
        throw {
          code: 'DELETE_FAILED',
          message: `Google Drive delete failed: ${errorText}`,
        }
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error
      }
      throw {
        code: 'DELETE_FAILED',
        message: `Google Drive delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalError: error,
      }
    }
  }

  async getSignedUrl(path: string, expirySeconds: number): Promise<SignedUrlResult> {
    const token = await this.ensureToken()

    // In Google Drive, path is actually the file ID
    const fileId = path

    try {
      // Get file metadata to ensure it exists and get the webContentLink
      const response = await fetch(
        `${GOOGLE_DRIVE_API}/files/${fileId}?fields=id,name,webContentLink,size,mimeType`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw {
          code: 'URL_GENERATION_FAILED',
          message: `Google Drive file not found: ${errorText}`,
        }
      }

      const file = await response.json() as { webContentLink?: string }

      if (!file.webContentLink) {
        throw {
          code: 'URL_GENERATION_FAILED',
          message: 'File does not have a download link',
        }
      }

      // Google Drive download links don't have a fixed expiry, but we set one for consistency
      // The actual URL validity depends on the user's access token
      const expiresAt = new Date(Date.now() + expirySeconds * 1000)

      return {
        url: file.webContentLink,
        expiresAt,
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error
      }
      throw {
        code: 'URL_GENERATION_FAILED',
        message: `Google Drive link generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

      // Verify the token is still valid by getting user info
      const response = await fetch(`${GOOGLE_DRIVE_API}/about?fields=user`, {
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
