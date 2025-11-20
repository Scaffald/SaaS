import { ROUTES, flattenRoutes, matchesRoute, type RouteConfig } from '@app/core/constants/routes'
import { usePageTitle } from '@app/core/hooks/usePageTitle'
import {
  buildDashboardBreadcrumbs,
  type DashboardBreadcrumbSegment,
} from '@app/core/utils/navigation/buildDashboardBreadcrumbs'
import { ProfileLayout } from '@app/ui'
import type { BreadcrumbItem } from '@app/ui'
import { usePathname } from 'expo-router'
import type { ComponentProps } from 'react'
import { useMemo } from 'react'

type ProfileLayoutProps = ComponentProps<typeof ProfileLayout>

type ProfilePageProps = Omit<ProfileLayoutProps, 'breadcrumbItems'> & {
  breadcrumbs?: DashboardBreadcrumbSegment[]
  breadcrumbItems?: BreadcrumbItem[]
  pageTitle?: string | (() => string | null)
  pageTitleDeps?: ReadonlyArray<unknown>
  formatDocumentTitle?: (title: string) => string
}

const PROFILE_ROUTES = flattenRoutes()

const findRouteForPath = (path: string | null): RouteConfig | null => {
  if (!path) {
    return null
  }

  const normalizedPath = path === '' ? '/' : path

  return (
    PROFILE_ROUTES.find((route) => route.path === normalizedPath) ??
    PROFILE_ROUTES.find((route) => matchesRoute(normalizedPath, route)) ??
    null
  )
}

export function ProfilePage({
  breadcrumbs,
  breadcrumbItems,
  pageTitle,
  pageTitleDeps = [],
  formatDocumentTitle,
  ...layoutProps
}: ProfilePageProps) {
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
        return pageTitle() ?? matchedRoute?.title ?? ROUTES.DASHBOARD.PROFILE.title
      }
      if (typeof pageTitle === 'string') {
        return pageTitle
      }

      const trail = computedBreadcrumbItems
      if (trail && trail.length > 0) {
        const activeItem =
          [...trail].reverse().find((item) => item.isActive) ?? trail[trail.length - 1]
        if (activeItem?.label) {
          return activeItem.label
        }
      }

      return matchedRoute?.title ?? ROUTES.DASHBOARD.PROFILE.title
    },
    deps: [matchedRoute?.title, computedBreadcrumbItems, ...pageTitleDeps],
    formatDocumentTitle,
  })

  return <ProfileLayout {...layoutProps} breadcrumbItems={computedBreadcrumbItems} />
}

