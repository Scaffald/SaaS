import { ROUTES, flattenRoutes, matchesRoute, type RouteConfig } from '@scf/core/constants/routes'
import { usePageTitle } from '@scf/core/hooks/usePageTitle'
import { useTranslation } from '@scf/core/utils/useTranslation'
import {
  buildDashboardBreadcrumbs,
  type DashboardBreadcrumbSegment,
} from '@scf/core/utils/navigation/buildDashboardBreadcrumbs'
import { DashboardLayout } from '@scf/core/components/layouts'
import type { BreadcrumbItemData } from '@scaffald/ui'
import { usePathname } from 'expo-router'
import type { ComponentProps } from 'react'
import { useMemo } from 'react'

type DashboardLayoutProps = ComponentProps<typeof DashboardLayout>

type DashboardPageProps = Omit<DashboardLayoutProps, 'breadcrumbItems'> & {
  /** Custom breadcrumb segments to build Dashboard hierarchy */
  breadcrumbs?: DashboardBreadcrumbSegment[]
  /** Provide fully computed breadcrumb items (takes precedence over breadcrumbs) */
  breadcrumbItems?: BreadcrumbItemData[]
  /** Static string or callback for page title (falls back to route title) */
  pageTitle?: string | (() => string | null)
  /** Dependency list for re-computing dynamic page titles */
  pageTitleDeps?: ReadonlyArray<unknown>
  /** Optional formatter for the web page title (used by `setDocumentTitle`) */
  formatDocumentTitle?: (title: string) => string
}

/**
 * Screens whose own content opens with a title, so the shared header would
 * be the second one on the page. They are opted out by name rather than by
 * each screen remembering to pass a flag, so the list is reviewable.
 */
const SCREENS_WITHOUT_SHARED_HEADER = new Set<string>([
  // The dashboard opens with the profile hero, which carries the name.
  ROUTES.DASHBOARD.path,
])

const ALL_ROUTES = flattenRoutes()

const findRouteForPath = (path: string | null): RouteConfig | null => {
  if (!path) {
    return null
  }

  const normalizedPath = path === '' ? '/' : path

  const exact = ALL_ROUTES.find((route) => route.path === normalizedPath)
  if (exact) {
    return exact
  }

  // Non-exact routes prefix-match, so an ancestor like /employers used to win
  // over /employers/org/:slug/logs/create purely by flatten order — giving
  // detail/create screens their section's title ("Employers" on the Record
  // Work Log page) (#385). Prefer the most specific matching route: most
  // static (non-param) segments first — so .../logs/create beats
  // .../logs/:workLogId — then longest path as the tie-break.
  const matches = ALL_ROUTES.filter((route) => matchesRoute(normalizedPath, route))
  if (matches.length === 0) {
    return null
  }
  const staticSegments = (route: RouteConfig) =>
    route.path.split('/').filter((s) => s && !s.startsWith(':')).length
  return matches.reduce((best, route) => {
    const byStatic = staticSegments(route) - staticSegments(best)
    if (byStatic !== 0) {
      return byStatic > 0 ? route : best
    }
    return route.path.length > best.path.length ? route : best
  })
}

export function DashboardPage({
  breadcrumbs,
  breadcrumbItems,
  pageTitle,
  pageTitleDeps = [],
  formatDocumentTitle,
  ...layoutProps
}: DashboardPageProps) {
  const pathname = usePathname()
  const matchedRoute = useMemo(() => findRouteForPath(pathname), [pathname])
  const { t, locale } = useTranslation()

  const computedBreadcrumbItems = useMemo(() => {
    if (breadcrumbItems) {
      return breadcrumbItems
    }
    if (breadcrumbs) {
      return buildDashboardBreadcrumbs(breadcrumbs)
    }
    return undefined
  }, [breadcrumbItems, breadcrumbs])

  usePageTitle({
    title: () => {
      if (typeof pageTitle === 'function') {
        return (
          pageTitle() ?? (matchedRoute ? t(matchedRoute.titleKey) : t(ROUTES.DASHBOARD.titleKey))
        )
      }
      if (typeof pageTitle === 'string') {
        return pageTitle
      }

      // Fallback to breadcrumb trail, then matched route, then Dashboard
      const trail = computedBreadcrumbItems
      if (trail && trail.length > 0) {
        const activeItem = trail[trail.length - 1]
        if (activeItem?.label) {
          return activeItem.label
        }
      }

      return matchedRoute ? t(matchedRoute.titleKey) : t(ROUTES.DASHBOARD.titleKey)
    },
    deps: [locale, matchedRoute?.titleKey, computedBreadcrumbItems, ...pageTitleDeps],
    formatDocumentTitle,
  })

  // The visible heading. A screen may pass `screenTitle` explicitly; nothing
  // else needs to, because the route already knows what it is called — which
  // is why 120 of 200 captured screens had no programmatic heading (#860)
  // while all of them showed a title.
  //
  // The nav label and the page title are deliberately the same string: the
  // prototype's audit called a nav item that opens a differently-named page
  // an inconsistency, and taking both from `titleKey` makes them agree by
  // construction.
  const resolvedScreenTitle = useMemo(() => {
    if (layoutProps.screenTitle !== undefined) return layoutProps.screenTitle
    if (typeof pageTitle === 'function') return pageTitle()
    if (typeof pageTitle === 'string') return pageTitle
    return matchedRoute ? t(matchedRoute.titleKey) : null
    // `pageTitleDeps` carries whatever a dynamic title closes over.
    // biome-ignore lint/correctness/useExhaustiveDependencies: callers declare their own deps
  }, [layoutProps.screenTitle, pageTitle, matchedRoute, t, locale, ...pageTitleDeps])

  const hideScreenHeader =
    layoutProps.hideScreenHeader ??
    (pathname ? SCREENS_WITHOUT_SHARED_HEADER.has(pathname) : false)

  return (
    <DashboardLayout
      {...layoutProps}
      breadcrumbItems={computedBreadcrumbItems}
      screenTitle={resolvedScreenTitle}
      screenKey={layoutProps.screenKey ?? pathname ?? null}
      hideScreenHeader={hideScreenHeader}
    />
  )
}
