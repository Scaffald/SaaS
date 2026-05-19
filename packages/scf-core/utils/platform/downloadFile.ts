/**
 * Cross-platform file download.
 *
 * Web: creates a hidden `<a download>` and clicks it.
 * Native: opens the URL in the OS browser (which triggers the OS download
 *   handler). For data URIs / blobs that have no remote URL, we fall back
 *   to sharing via `Linking` — for richer behavior (share sheet, save to
 *   Files), feature owners can layer on `expo-sharing` later.
 *
 * Replaces the `document.createElement('a').click()` trick littered through
 * the payments/transactions/connections features.
 */

export interface DownloadFileOptions {
  /** URL or data URI to download. */
  url: string
  /** Suggested filename. Used by web; informational only on native. */
  filename?: string
}

export type DownloadFile = (options: DownloadFileOptions) => Promise<void>

export const downloadFile: DownloadFile = () => {
  throw new Error(
    '[platform/downloadFile] platform-specific module was not resolved; check Metro config'
  )
}
