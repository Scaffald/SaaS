import { Platform } from 'react-native'
import { getBaseUrl } from './getBaseUrl'
import { openExternalLink } from './platform'

const DEFAULT_ORIGIN = 'https://scaffald.com'

/**
 * Absolute origin for links we hand to someone else — copied to a clipboard,
 * rendered into a QR code, put in a share sheet.
 *
 * Distinct from getBaseUrl(), which deliberately returns '' on web so callers
 * navigate same-origin. That is right for navigation and wrong here: a copied
 * "/users/eric" is useless to the person you send it to.
 *
 * On web the current window origin wins so a link copied in local dev resolves
 * back to the same machine; in production that origin *is* the apex. Native has
 * no window, so it reads EXPO_PUBLIC_URL and falls back to the apex.
 */
export function resolvePublicOrigin(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.EXPO_PUBLIC_URL?.replace(/\/$/, '') ?? DEFAULT_ORIGIN
}

/**
 * Absolute, shareable URL for a public profile.
 *
 * Use this rather than getPublicProfileFullUrl when the URL leaves the app.
 */
export function getPublicProfileShareUrl(slug: string): string {
  return `${resolvePublicOrigin()}${getPublicProfilePath(slug)}`
}

/** The same URL without its scheme, for display. */
export function getPublicProfileDisplayUrl(slug: string): string {
  return getPublicProfileShareUrl(slug).replace(/^https?:\/\//, '')
}

/**
 * Public profile path (no origin). Use for same-origin navigation or with getPublicProfileFullUrl for external/new tab.
 */
export function getPublicProfilePath(slug: string): string {
  // Must match the actual route — apps/scaffald/app/(public)/users/[slug].tsx
  // (ROUTES.PUBLIC_PROFILE.path === '/users/:slug'). The old '/u/:slug' had no
  // matching route and produced an "Unmatched route" error (SC-74).
  return `/users/${slug}`
}

/**
 * Full URL for public profile (origin + path). Use for opening in new tab or native Linking.
 */
export function getPublicProfileFullUrl(slug: string): string {
  const base = getBaseUrl()
  const path = getPublicProfilePath(slug)
  if (!base) return path
  const normalizedBase = base.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

/**
 * Open the user's public profile in a new tab (web) or external browser (native).
 */
export function openPublicProfileInNewTab(slug: string): void {
  openExternalLink(getPublicProfileFullUrl(slug))
}
