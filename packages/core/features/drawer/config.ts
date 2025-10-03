import type { JSX } from "react";
import { DASHBOARD_ROUTES, ROUTES } from "@app/core/constants/routes";
import {
  BarChart3,
  Building2,
  Cog,
  Map as MapIcon,
  Palette,
  User,
  Users,
} from "@tamagui/lucide-icons";
import type { DrawerItemConfig, DrawerSectionConfig } from "./types";

/**
 * Generates drawer items dynamically from dashboard routes
 * @returns Array of drawer item configurations
 */
export const generateDashboardDrawerItems = (): DrawerItemConfig[] => {
  const items: DrawerItemConfig[] = [];

  // Main dashboard item
  items.push({
    key: "dashboard",
    title: "Dashboard",
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

  // Settings route - Make expandable with children
  if (DASHBOARD_ROUTES.SETTINGS) {
    // Filter out the index route to avoid duplication with parent
    const settingsChildren = (DASHBOARD_ROUTES.SETTINGS.childrenArray || [])
      .filter(
        (route) => route.path !== DASHBOARD_ROUTES.SETTINGS?.path,
      );

    items.push({
      key: "settings",
      title: "Settings",
      href: DASHBOARD_ROUTES.SETTINGS.fullPath, // Keep href for direct navigation if needed
      icon: Cog,
      isExpandable: true,
      subItems: settingsChildren.map((childRoute) => ({
        key: `settings-${childRoute.path.split("/").pop()}`,
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
 */
export const drawerSections: DrawerSectionConfig[] = [
  {
    key: "main",
    title: "",
    items: generateDashboardDrawerItems(),
  },
];
