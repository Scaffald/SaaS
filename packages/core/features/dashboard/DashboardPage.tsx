import { ROUTES, flattenRoutes, matchesRoute, type RouteConfig } from '@app/core/constants/routes'
import { usePageTitle } from '@app/core/hooks/usePageTitle'
import {
  buildDashboardBreadcrumbs,
  type DashboardBreadcrumbSegment,
} from '@app/core/utils/navigation/buildDashboardBreadcrumbs'
import { DashboardLayout } from '@app/ui'
import type { BreadcrumbItem } from '@app/ui'
import { usePathname } from 'expo-router'
import type { ComponentProps } from 'react'
import { useMemo } from 'react'

type DashboardLayoutProps = ComponentProps<typeof DashboardLayout>

type DashboardPageProps = Omit<DashboardLayoutProps, 'breadcrumbItems'> & {
  /** Custom breadcrumb segments to build Dashboard hierarchy */
  breadcrumbs?: DashboardBreadcrumbSegment[]
  /** Provide fully computed breadcrumb items (takes precedence over breadcrumbs) */
  breadcrumbItems?: BreadcrumbItem[]
  /** Static string or callback for page title (falls back to route title) */
  pageTitle?: string | (() => string | null)
  /** Dependency list for re-computing dynamic page titles */
  pageTitleDeps?: ReadonlyArray<unknown>
  /** Optional formatter for web document.title */
  formatDocumentTitle?: (title: string) => string
}

const ALL_ROUTES = flattenRoutes()

const findRouteForPath = (path: string | null): RouteConfig | null => {
  if (!path) {
    return null
  }

  const normalizedPath = path === '' ? '/' : path

  return (
    ALL_ROUTES.find((route) => route.path === normalizedPath) ??
    ALL_ROUTES.find((route) => matchesRoute(normalizedPath, route)) ??
    null
  )
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
        return pageTitle() ?? matchedRoute?.title ?? ROUTES.DASHBOARD.title
      }
      if (typeof pageTitle === 'string') {
        return pageTitle
      }

      // Fallback to breadcrumb trail, then matched route, then Dashboard
      const trail = computedBreadcrumbItems
      if (trail && trail.length > 0) {
        const activeItem =
          [...trail].reverse().find((item) => item.isActive) ?? trail[trail.length - 1]
        if (activeItem?.label) {
          return activeItem.label
        }
      }

      return matchedRoute?.title ?? ROUTES.DASHBOARD.title
    },
    deps: [matchedRoute?.title, computedBreadcrumbItems, ...pageTitleDeps],
    formatDocumentTitle,
  })

  return <DashboardLayout {...layoutProps} breadcrumbItems={computedBreadcrumbItems} />
}

