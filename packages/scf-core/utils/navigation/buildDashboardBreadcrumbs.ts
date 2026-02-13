import { type RouteConfig, ROUTES } from '@scf/core/constants/routes'
import { i18n } from '@scf/core/locales'
import type { BreadcrumbItemData } from '@scaffald/ui'

type RouteSegment = {
  route: RouteConfig
  isActive?: boolean
}

type CustomSegment = {
  label: string
  href?: string
  isActive?: boolean
}

export type DashboardBreadcrumbSegment = RouteSegment | CustomSegment

const isRouteSegment = (segment: DashboardBreadcrumbSegment): segment is RouteSegment =>
  'route' in segment

/**
 * Helper to build consistent dashboard breadcrumbs with Dashboard as apex.
 * Accepts route configs or custom segments (for dynamic titles).
 */
export function buildDashboardBreadcrumbs(
  segments: DashboardBreadcrumbSegment[]
): BreadcrumbItemData[] {
  const items: BreadcrumbItemData[] = [
    {
      label: i18n.t(ROUTES.DASHBOARD.titleKey),
      href: ROUTES.DASHBOARD.path,
    },
  ]

  segments.forEach((segment, _index) => {
    if (isRouteSegment(segment)) {
      items.push({
        label: i18n.t(segment.route.titleKey),
        href: segment.route.path,
      })
      return
    }

    items.push({
      label: segment.label,
      href: segment.href,
    })
  })

  return items
}
