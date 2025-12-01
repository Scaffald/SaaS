import { type RouteConfig, ROUTES } from "@app/core/constants/routes";
import { i18n } from "@app/core/locales";
import type { BreadcrumbItem } from "@unicornlove/ui";

type RouteSegment = {
  route: RouteConfig;
  isActive?: boolean;
};

type CustomSegment = {
  label: string;
  href?: string;
  isActive?: boolean;
};

export type DashboardBreadcrumbSegment = RouteSegment | CustomSegment;

const isRouteSegment = (
  segment: DashboardBreadcrumbSegment,
): segment is RouteSegment => "route" in segment;

/**
 * Helper to build consistent dashboard breadcrumbs with Dashboard as apex.
 * Accepts route configs or custom segments (for dynamic titles).
 */
export function buildDashboardBreadcrumbs(
  segments: DashboardBreadcrumbSegment[],
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    {
      label: i18n.t(ROUTES.DASHBOARD.titleKey),
      href: ROUTES.DASHBOARD.path,
      isActive: segments.length === 0,
    },
  ];

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    if (isRouteSegment(segment)) {
      items.push({
        label: i18n.t(segment.route.titleKey),
        href: segment.route.path,
        isActive: segment.isActive ?? isLast,
      });
      return;
    }

    items.push({
      label: segment.label,
      href: segment.href,
      isActive: segment.isActive ?? isLast,
    });
  });

  return items;
}
