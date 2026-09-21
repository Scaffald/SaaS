/**
 * The current route's own title, for layouts that render a `ScreenHeader`.
 *
 * Nav labels and page titles come from the same `titleKey`, so they agree by
 * construction. The prototype's audit called a nav item that opens a
 * differently-named page an inconsistency ("Find talent" opening "Worker
 * search"); taking both from one source removes the chance of drift rather
 * than asking each screen to remember.
 *
 * `DashboardPage` resolves its own title, because it already has to for the
 * browser tab and lets callers override it. This hook is for the layouts that
 * have no such wrapper — Profile and Assessments — so they do not each
 * reimplement route matching.
 */

import { usePathname } from 'expo-router'
import { useMemo } from 'react'
import { ROUTES, flattenRoutes, matchesRoute, type RouteConfig } from '../constants/routes'
import { useTranslation } from '../utils/useTranslation'

const ALL_ROUTES = flattenRoutes()

/**
 * Most specific match wins: most static (non-param) segments first, then the
 * longest path as the tie-break. A prefix match would otherwise give a detail
 * screen its section's title.
 */
function findRouteForPath(path: string | null): RouteConfig | null {
  if (!path) return null
  const normalizedPath = path === '' ? '/' : path

  const exact = ALL_ROUTES.find((route) => route.path === normalizedPath)
  if (exact) return exact

  const matches = ALL_ROUTES.filter((route) => matchesRoute(normalizedPath, route))
  if (matches.length === 0) return null

  const staticSegments = (route: RouteConfig) =>
    route.path.split('/').filter((segment) => segment && !segment.startsWith(':')).length

  return matches.reduce((best, route) => {
    const byStatic = staticSegments(route) - staticSegments(best)
    if (byStatic !== 0) return byStatic > 0 ? route : best
    return route.path.length > best.path.length ? route : best
  })
}

export function useRouteScreenTitle(): { title: string | null; routeKey: string | null } {
  const pathname = usePathname()
  const { t, locale } = useTranslation()

  return useMemo(() => {
    const matched = findRouteForPath(pathname)
    return {
      title: matched ? t(matched.titleKey) : null,
      // The path, not the titleKey: two routes may share a title, and the
      // collapsed-tip preference belongs to the screen, not the word.
      routeKey: pathname ?? null,
    }
    // `locale` is read through `t`.
  }, [pathname, t, locale])
}

/** Exported for the dashboard's own title resolution, which predates this hook. */
export { findRouteForPath, ROUTES }
