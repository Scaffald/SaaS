import { ROUTES } from "@app/core/constants/routes";
import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardCheck,
  Map as MapIcon,
  User,
  Users,
} from "@tamagui/lucide-icons";
import type { DrawerItemConfig } from "./types";

/**
 * Generates drawer items dynamically from dashboard routes
 * @returns Array of drawer item configurations
 */
export const generateDashboardDrawerItems = (): DrawerItemConfig[] => {
  const items: DrawerItemConfig[] = [];

  // Main dashboard item
  items.push({
    key: "dashboard",
    titleKey: "navigation.dashboard",
    href: ROUTES.DASHBOARD.path,
    routeKey: "DASHBOARD",
    icon: BarChart3,
  });

  // Map - top-level item
  items.push({
    key: "map",
    titleKey: "navigation.discoverMap",
    href: ROUTES.DASHBOARD.DISCOVER.MAP.path,
    routeKey: "DASHBOARD_DISCOVER_MAP",
    icon: MapIcon,
  });

  // Workers - top-level item
  items.push({
    key: "workers",
    titleKey: "navigation.discoverWorkers",
    href: ROUTES.DASHBOARD.DISCOVER.WORKERS.path,
    routeKey: "DASHBOARD_DISCOVER_WORKERS",
    icon: Users,
  });

  // Employers - top-level item
  items.push({
    key: "employers",
    titleKey: "navigation.discoverEmployers",
    href: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path,
    routeKey: "DASHBOARD_DISCOVER_EMPLOYERS",
    icon: Building2,
  });

  // Jobs - top-level item
  items.push({
    key: "jobs",
    titleKey: "navigation.discoverJobs",
    href: ROUTES.DASHBOARD.DISCOVER.JOBS.path,
    routeKey: "DASHBOARD_DISCOVER_JOBS",
    icon: Briefcase,
  });

  // Profile - top-level item (sub-navigation handled by tab navigator)
  items.push({
    key: "profile",
    titleKey: "navigation.profile",
    href: ROUTES.DASHBOARD.PROFILE.path,
    routeKey: "DASHBOARD_PROFILE",
    icon: User,
  });

  items.push({
    key: "assessments",
    titleKey: "navigation.assessments",
    href: ROUTES.DASHBOARD.ASSESSMENTS.path,
    routeKey: "DASHBOARD_ASSESSMENTS",
    icon: ClipboardCheck,
  });

  return items;
};

/**
 * Get drawer items for the drawer menu
 * @returns Array of drawer item configurations
 */
export const getDrawerItems = (): DrawerItemConfig[] => {
  return generateDashboardDrawerItems();
};
