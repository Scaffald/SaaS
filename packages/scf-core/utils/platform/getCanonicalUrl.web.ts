import type { GetCanonicalUrl } from './getCanonicalUrl'

/**
 * Client-only. Returns `undefined` on the server, so anything rendered from
 * it differs between the server HTML and the client's first render — a
 * hydration mismatch that discards the server tree (#786). Use it for values
 * that only exist after an interaction (a share link built on press); for
 * anything server-rendered, build the URL from the site origin instead.
 */
export const getCanonicalUrl: GetCanonicalUrl = (path) => {
  if (typeof window === 'undefined' || !window.location) return undefined
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${window.location.origin}${normalized}`
}
