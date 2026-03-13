import { Platform, Linking } from 'react-native'
import { getBaseUrl } from './getBaseUrl'

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
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const url = getPublicProfileFullUrl(slug)
    window.open(url, '_blank', 'noopener,noreferrer')
  } else {
    const url = getPublicProfileFullUrl(slug)
    void Linking.openURL(url)
  }
}
