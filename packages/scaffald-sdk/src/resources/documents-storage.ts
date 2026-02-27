import { Resource } from './base.js'

export type StorageBackend = 'supabase' | 'dropbox' | 'google_drive'

export interface StoragePreferenceResponse {
  storagePreference: StorageBackend
}

export interface SetStoragePreferenceParams {
  storagePreference: StorageBackend
}

export interface SetStoragePreferenceResponse {
  storagePreference: StorageBackend
  message: string
}

export class DocumentsStorage extends Resource {
  async getStoragePreference(): Promise<StoragePreferenceResponse> {
    return this.get<StoragePreferenceResponse>('/v1/documents/storage-preference')
  }

  async setStoragePreference(
    params: SetStoragePreferenceParams
  ): Promise<SetStoragePreferenceResponse> {
    return this.put<SetStoragePreferenceResponse>(
      '/v1/documents/storage-preference',
      params
    )
  }
}
