import { getBaseUrl } from './getBaseUrl'
import { openExternalLink } from './platform'

/**
 * Public profile path (no origin). Use for same-origin navigation or with getPublicProfileFullUrl for external/new tab.
 */
export function getPublicProfilePath(slug: string): string {
  return `/u/${slug}`
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
