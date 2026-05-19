import type { GetCanonicalUrl } from './getCanonicalUrl'

export const getCanonicalUrl: GetCanonicalUrl = (path) => {
  if (typeof window === 'undefined' || !window.location) return undefined
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${normalized}`
}
