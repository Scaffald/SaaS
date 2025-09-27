/**
 * Normalizes a path string by cleaning up query parameters, tabs routes, and extra slashes
 * @param value - The path string to normalize
 * @returns Normalized path string
 */
export const normalizePath = (value: string) => {
  if (!value) return '/'
  const withoutQuery = value.split('?')[0]
  const cleaned = withoutQuery.replace(/\/\(tabs\)/g, '')
  const normalized = cleaned.replace(/\/+/g, '/')
  if (normalized === '' || normalized === '/') return '/'
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

export const isActivePath = (pathname: string, href: string) => {
  if (href === '/') {
    return pathname === '/' || pathname === '/index'
  }

  // Special case for dashboard: only match exact path or /dashboard/index
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/dashboard/index'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
