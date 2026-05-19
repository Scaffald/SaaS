/**
 * Cross-platform external-link opener.
 *
 * Web: opens in a new tab via `window.open`.
 * Native: opens in the OS browser via `Linking.openURL`, or in an in-app
 *   browser when `inApp: true` is requested (uses expo-web-browser if
 *   available, falls back to Linking).
 *
 * Always use this over `window.open(...)` in feature code. The concrete
 * implementation lives in `openExternalLink.web.ts` / `.native.ts` and is
 * selected by Metro at build time — feature code stays platform-agnostic.
 */

export interface OpenExternalLinkOptions {
  /**
   * When true on native, open in an in-app browser (SFSafariViewController /
   * Chrome Custom Tabs) instead of the OS browser. Ignored on web.
   */
  inApp?: boolean
}

export type OpenExternalLink = (url: string, opts?: OpenExternalLinkOptions) => void

// The shared module never runs in the bundle — Metro resolves a platform
// variant first. This default exists only so type-checking against the
// barrel works in tools that don't honor Metro extensions.
export const openExternalLink: OpenExternalLink = () => {
  throw new Error(
    '[platform/openExternalLink] platform-specific module was not resolved; check Metro config'
  )
}
