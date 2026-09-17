/**
 * Storage backends barrel.
 *
 * Re-exports only. The contract lives in ./types.ts so the implementations can
 * import it without importing the barrel that exports them (#777).
 */

export type {
  IStorageBackend,
  SignedUrlResult,
  StorageBackendType,
  StorageError,
  UploadOptions,
  UploadResult,
} from "./types.ts";

export { SupabaseStorageBackend } from "./supabase-backend.ts";
export { DropboxStorageBackend } from "./dropbox-backend.ts";
export { GoogleDriveStorageBackend } from "./google-drive-backend.ts";
