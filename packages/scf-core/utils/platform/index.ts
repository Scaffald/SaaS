/**
 * Cross-platform primitives for browser-only APIs.
 *
 * Each export is implemented as a Metro platform extension:
 *   - `<name>.web.ts` (browser implementation)
 *   - `<name>.native.ts` (iOS/Android implementation)
 *   - `<name>.ts` (shared types + a throwing default for static analysis)
 *
 * Feature code should always import from this barrel — never reach for
 * `window.*`, `document.*`, `localStorage`, etc. directly.
 *
 * See docs/agents/PLATFORM-SAFETY-AUDIT.md (if present) for the full rationale.
 */

export { openExternalLink } from './openExternalLink'
export type { OpenExternalLink, OpenExternalLinkOptions } from './openExternalLink'

export { useUnsavedChangesPrompt } from './useUnsavedChangesPrompt'
export type { UseUnsavedChangesPrompt } from './useUnsavedChangesPrompt'

export { confirmDialog } from './confirmDialog'
export type { ConfirmDialog, ConfirmDialogOptions } from './confirmDialog'

export { kvStorage } from './kvStorage'
export type { KVStorage } from './kvStorage'

export { sessionKvStorage } from './sessionKvStorage'
export type { SessionKVStorage } from './sessionKvStorage'

export { downloadFile } from './downloadFile'
export type { DownloadFile, DownloadFileOptions } from './downloadFile'

export { pickFile } from './pickFile'
export type { PickFile, PickFileOptions, PickedFile } from './pickFile'

export { getCanonicalUrl } from './getCanonicalUrl'
export type { GetCanonicalUrl } from './getCanonicalUrl'

export { setDocumentTitle } from './setDocumentTitle'
export type { SetDocumentTitle } from './setDocumentTitle'

export { reloadPage } from './reloadPage'
export type { ReloadPage } from './reloadPage'
