/**
 * Build a canonical (absolute) URL for a given path.
 *
 * Web: `${window.location.origin}${path}`.
 * Native: `undefined` — there is no canonical URL concept for native apps.
 *   Callers should treat undefined as "skip SEO output".
 */

export type GetCanonicalUrl = (path: string) => string | undefined

export const getCanonicalUrl: GetCanonicalUrl = () => undefined
