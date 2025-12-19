/**
 * Supabase Storage Backend
 *
 * Default storage backend using Supabase Storage
 * Files are stored in the 'organization-documents' bucket
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { IStorageBackend, SignedUrlResult, UploadOptions, UploadResult } from './index.ts';

export class SupabaseStorageBackend implements IStorageBackend {
  readonly type = 'supabase' as const
  private readonly bucket = 'organization-documents'
  private readonly supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async upload(file: Uint8Array, path: string, options: UploadOptions): Promise<UploadResult> {
    const { error } = await this.supabase.storage.from(this.bucket).upload(path, file, {
      contentType: options.contentType,
      upsert: options.upsert ?? false,
    })

    if (error) {
      throw {
        code: 'UPLOAD_FAILED',
        message: `Supabase upload failed: ${error.message}`,
        originalError: error,
      }
    }

    // Calculate checksum
    const hashBuffer = await crypto.subtle.digest('SHA-256', file)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    return {
      path,
      storageBackend: 'supabase',
      size: file.length,
      checksum,
    }
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(this.bucket).remove([path])

    if (error) {
      throw {
        code: 'DELETE_FAILED',
        message: `Supabase delete failed: ${error.message}`,
        originalError: error,
      }
    }
  }

  async getSignedUrl(path: string, expirySeconds: number): Promise<SignedUrlResult> {
    const { data, error } = await this.supabase.storage.from(this.bucket).createSignedUrl(path, expirySeconds)

    if (error || !data?.signedUrl) {
      throw {
        code: 'URL_GENERATION_FAILED',
        message: `Supabase signed URL generation failed: ${error?.message || 'No URL returned'}`,
        originalError: error,
      }
    }

    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
    }
  }

  async isAvailable(): Promise<boolean> {
    // Supabase Storage is always available if we have a valid client
    // We could add a health check here if needed
    return true
  }
}
