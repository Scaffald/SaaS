import { getBaseUrl } from './getBaseUrl'
import { openExternalLink } from './platform'

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
