import type { JSX } from "react";
import {
  DASHBOARD_ROUTES,
  OFFICE_ROUTES,
  ROUTES,
} from "@app/core/constants/routes";
import {
  BarChart3,
  Briefcase,
  Building2,
  Map as MapIcon,
  Palette,
  User,
  Users,
} from "@tamagui/lucide-icons";
import type { DrawerItemConfig, DrawerSectionConfig } from "./types";

/**
 * Generates drawer items dynamically from dashboard routes
 * @param options - Optional configuration for drawer items
 * @param options.includeOfficeLink - Whether to include the Office link (for admin users)
 * @returns Array of drawer item configurations
 */
export const generateDashboardDrawerItems = (options?: {
  includeOfficeLink?: boolean;
}): DrawerItemConfig[] => {
  const items: DrawerItemConfig[] = [];

  // Office section (for admin users only) - Make expandable with Users and Jobs
  if (options?.includeOfficeLink && OFFICE_ROUTES.INDEX) {
    const officeSubItems: DrawerItemConfig[] = [];

    // Add Users sub-item if available
    if (OFFICE_ROUTES.USERS) {
      officeSubItems.push({
        key: "office-users",
        title: OFFICE_ROUTES.USERS.title || "Users",
        href: OFFICE_ROUTES.USERS.fullPath,
      });
    }

    // Add Jobs sub-item if available
    if (OFFICE_ROUTES.JOBS) {
      officeSubItems.push({
        key: "office-jobs",
        title: OFFICE_ROUTES.JOBS.title || "Jobs",
        href: OFFICE_ROUTES.JOBS.fullPath,
      });
    }

    items.push({
      key: "office",
      title: "Office",
      href: OFFICE_ROUTES.INDEX.fullPath,
      icon: Building2,
      isExpandable: officeSubItems.length > 0,
      subItems: officeSubItems.length > 0 ? officeSubItems : undefined,
    });
  }

  // Main dashboard item
  items.push({
    key: "dashboard",
    title: DASHBOARD_ROUTES.INDEX?.title || "Dashboard",
    href: DASHBOARD_ROUTES.INDEX?.fullPath || "/dashboard",
    icon: BarChart3,
  });

  // Discover route - Make expandable with children
  if (DASHBOARD_ROUTES.Discover) {
    // Include all children including the index route since parent is expandable
    const discoverChildren = DASHBOARD_ROUTES.Discover.childrenArray || [];

    items.push({
      key: "discover",
      title: "Discover",
      href: DASHBOARD_ROUTES.Discover.fullPath, // Required by type but not used for navigation when expandable
      icon: MapIcon,
      isExpandable: true,
      subItems: discoverChildren.map((childRoute) => ({
        key: `discover-${childRoute.path.split("/").pop()}`,
        title: childRoute.title || "Untitled",
        href: childRoute.fullPath,
        // No icon for child items
      })),
    });
  }

  // Profile route - Make expandable with children
  if (DASHBOARD_ROUTES.PROFILE) {
    // Filter out the index route to avoid duplication with parent
    const profileChildren = (DASHBOARD_ROUTES.PROFILE.childrenArray || [])
      .filter(
        (route) => route.path !== DASHBOARD_ROUTES.PROFILE?.path,
      );

    items.push({
      key: "profile",
      title: "Profile",
      href: DASHBOARD_ROUTES.PROFILE.fullPath, // Keep href for direct navigation if needed
      icon: User,
      isExpandable: true,
      subItems: profileChildren.map((childRoute) => ({
        key: `profile-${childRoute.path.split("/").pop()}`,
        title: childRoute.title || "Untitled",
        href: childRoute.fullPath,
        // No icon for child items
      })),
    });
  }

  return items;
};

/**
 * Main drawer sections configuration
 * @param options - Optional configuration for drawer sections
 * @param options.includeOfficeLink - Whether to include the Office link (for admin users)
 * @returns Array of drawer section configurations
 */
export const getDrawerSections = (options?: {
  includeOfficeLink?: boolean;
}): DrawerSectionConfig[] => [
  {
    key: "main",
    title: "",
    items: generateDashboardDrawerItems(options),
  },
];

/**
 * Default drawer sections configuration (backward compatibility)
 */
export const drawerSections: DrawerSectionConfig[] = getDrawerSections();
