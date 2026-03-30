import { ROUTES } from '@scf/core/constants/routes'

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

export const isActivePath = (pathname: string, href: string, exact?: boolean) => {
  if (exact) {
    return pathname === href || pathname === `${href}/index`
  }

  if (href === '/') {
    return pathname === '/' || pathname === '/index'
  }

  // Special case for dashboard: expand only on home, news, and analytics — not settings, user profiles, etc.
  const dashboardPath = ROUTES.DASHBOARD.path
  const analyticsPath = ROUTES.DASHBOARD.ANALYTICS.path
  if (href === dashboardPath) {
    return (
      pathname === dashboardPath ||
      pathname === `${dashboardPath}/index` ||
      pathname === ROUTES.DASHBOARD.NEWS.path ||
      pathname === analyticsPath ||
      pathname === `${analyticsPath}/index` ||
      pathname.startsWith(`${analyticsPath}/`)
    )
  }

  // Special case for office: match exact path or child paths
  const officePath = ROUTES.OFFICE.path
  if (href === officePath) {
    return (
      pathname === officePath ||
      pathname === `${officePath}/index` ||
      pathname.startsWith(`${officePath}/`)
    )
  }

  // Special case for communities: match exact path or child paths
  const communitiesPath = ROUTES.COMMUNITIES.path
  if (href === communitiesPath) {
    return (
      pathname === communitiesPath ||
      pathname === `${communitiesPath}/index` ||
      pathname.startsWith(`${communitiesPath}/`)
    )
  }

  // Special case for assessments: also match career-explorer (nav sibling under Assessments)
  const assessmentsPath = ROUTES.ASSESSMENTS.path
  if (href === assessmentsPath) {
    return (
      pathname === assessmentsPath ||
      pathname === `${assessmentsPath}/index` ||
      pathname.startsWith(`${assessmentsPath}/`) ||
      pathname === ROUTES.ASSESSMENTS.CAREER_EXPLORER.path ||
      pathname.startsWith(`${ROUTES.ASSESSMENTS.CAREER_EXPLORER.path}/`)
    )
  }

  // Special case for workers: also match /workers/map (nav sibling under Workers)
  const workersPath = ROUTES.WORKERS.path
  if (href === workersPath) {
    return (
      pathname === workersPath ||
      pathname === `${workersPath}/index` ||
      pathname.startsWith(`${workersPath}/`)
    )
  }

  // Special case for employers: match /employers and children
  const employersPath = ROUTES.EMPLOYERS.path
  if (href === employersPath) {
    return (
      pathname === employersPath ||
      pathname.startsWith(`${employersPath}/`)
    )
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
