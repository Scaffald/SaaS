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
  ClipboardCheck,
  Map as MapIcon,
  User,
  Users,
} from "@tamagui/lucide-icons";
import type { DrawerItemConfig, DrawerSectionConfig } from "./types";

export interface AssessmentStatus {
  luscher1: {
    isCompleted: boolean;
    isLoading: boolean;
    isOnCooldown?: boolean;
    nextAvailableAt?: string | null;
  };
  ipip: { isCompleted: boolean; isLoading: boolean };
  luscher2: { isCompleted: boolean; isLoading: boolean };
  riasec: { isCompleted: boolean; isLoading: boolean };
  occupation: { isCompleted: boolean; isLoading: boolean };
}

/**
 * Generates drawer items dynamically from dashboard routes
 * @param options - Optional configuration for drawer items
 * @param options.includeOfficeLink - DEPRECATED: Office navigation now in header flyout menu
 * @param options.assessmentStatus - Assessment completion status for checkmarks
 * @returns Array of drawer item configurations
 */
export const generateDashboardDrawerItems = (options?: {
  includeOfficeLink?: boolean;
  assessmentStatus?: AssessmentStatus;
  includeTeamManagementLink?: boolean;
}): DrawerItemConfig[] => {
  const items: DrawerItemConfig[] = [];

  // Office section removed - now accessed via header flyout menu
  // includeOfficeLink parameter kept for backward compatibility but not used

  // Main dashboard item
  items.push({
    key: "dashboard",
    titleKey: "navigation.dashboard",
    href: ROUTES.DASHBOARD.path,
    routeKey: "DASHBOARD",
    icon: BarChart3,
  });

  // Discover route - Always show subItems, parent is clickable
  items.push({
    key: "discover",
    titleKey: "navigation.discover",
    href: ROUTES.DASHBOARD_DISCOVER.path,
    routeKey: "DASHBOARD_DISCOVER",
    icon: MapIcon,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      {
        key: "discover-map",
        titleKey: "navigation.discoverMap",
        href: ROUTES.DASHBOARD_DISCOVER_MAP.path,
        routeKey: "DASHBOARD_DISCOVER_MAP",
      },
      {
        key: "discover-workers",
        titleKey: "navigation.discoverWorkers",
        href: ROUTES.DASHBOARD_DISCOVER_WORKERS.path,
        routeKey: "DASHBOARD_DISCOVER_WORKERS",
      },
      {
        key: "discover-employers",
        titleKey: "navigation.discoverEmployers",
        href: ROUTES.DASHBOARD_DISCOVER_EMPLOYERS.path,
        routeKey: "DASHBOARD_DISCOVER_EMPLOYERS",
      },
      {
        key: "discover-jobs",
        titleKey: "navigation.discoverJobs",
        href: ROUTES.DASHBOARD_DISCOVER_JOBS.path,
        routeKey: "DASHBOARD_DISCOVER_JOBS",
      },
    ],
  });

  // Profile route - Always show subItems, parent is clickable
  items.push({
    key: "profile",
    titleKey: "navigation.profile",
    href: ROUTES.DASHBOARD_PROFILE.path,
    routeKey: "DASHBOARD_PROFILE",
    icon: User,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      {
        key: "profile-general",
        titleKey: "navigation.profileGeneral",
        href: ROUTES.DASHBOARD_PROFILE_GENERAL.path,
        routeKey: "DASHBOARD_PROFILE_GENERAL",
      },
      {
        key: "profile-employment",
        titleKey: "navigation.profileEmployment",
        href: ROUTES.DASHBOARD_PROFILE_EMPLOYMENT.path,
        routeKey: "DASHBOARD_PROFILE_EMPLOYMENT",
      },
      {
        key: "profile-skills",
        titleKey: "navigation.profileSkills",
        href: ROUTES.DASHBOARD_PROFILE_SKILLS.path,
        routeKey: "DASHBOARD_PROFILE_SKILLS",
      },
      {
        key: "profile-certifications",
        titleKey: "navigation.profileCertifications",
        href: ROUTES.DASHBOARD_PROFILE_CERTIFICATIONS.path,
        routeKey: "DASHBOARD_PROFILE_CERTIFICATIONS",
      },
      {
        key: "profile-education",
        titleKey: "navigation.profileEducation",
        href: ROUTES.DASHBOARD_PROFILE_EDUCATION.path,
        routeKey: "DASHBOARD_PROFILE_EDUCATION",
      },
      {
        key: "profile-experience",
        titleKey: "navigation.profileExperience",
        href: ROUTES.DASHBOARD_PROFILE_EXPERIENCE.path,
        routeKey: "DASHBOARD_PROFILE_EXPERIENCE",
      },
    ],
  });

  // Assessments route - Always show sub-items for each assessment
  const assessmentSubItems: DrawerItemConfig[] = [
    {
      key: "assessment-pulse",
      titleKey: "navigation.assessmentsPulse",
      href: ROUTES.DASHBOARD_ASSESSMENT_LUSCHER_1.path,
      routeKey: "DASHBOARD_ASSESSMENT_LUSCHER_1",
      isCompleted: options?.assessmentStatus?.luscher1.isCompleted,
      isOnCooldown: options?.assessmentStatus?.luscher1.isOnCooldown,
    },
    {
      key: "assessment-ipip",
      titleKey: "navigation.assessmentsPersonality",
      href: ROUTES.DASHBOARD_ASSESSMENT_IPIP.path,
      routeKey: "DASHBOARD_ASSESSMENT_IPIP",
      isCompleted: options?.assessmentStatus?.ipip.isCompleted,
    },
    {
      key: "assessment-riasec",
      titleKey: "navigation.assessmentsRiasec",
      href: ROUTES.DASHBOARD_ASSESSMENT_RIASEC.path,
      routeKey: "DASHBOARD_ASSESSMENT_RIASEC",
      isCompleted: options?.assessmentStatus?.riasec.isCompleted,
    },
    {
      key: "assessment-occupation",
      titleKey: "navigation.assessmentsOccupation",
      href: ROUTES.DASHBOARD_ASSESSMENT_OCCUPATION.path,
      routeKey: "DASHBOARD_ASSESSMENT_OCCUPATION",
      isCompleted: options?.assessmentStatus?.occupation.isCompleted,
    },
  ];

  items.push({
    key: "assessments",
    titleKey: "navigation.assessments",
    href: ROUTES.DASHBOARD_ASSESSMENTS.path,
    routeKey: "DASHBOARD_ASSESSMENTS",
    icon: ClipboardCheck,
    isExpandable: true,
    expandOnActive: true,
    subItems: assessmentSubItems,
  });

  return items;
};

/**
 * Main drawer sections configuration
 * @param options - Optional configuration for drawer sections
 * @param options.includeOfficeLink - Whether to include the Office link (for admin users)
 * @param options.assessmentStatus - Assessment completion status for checkmarks
 * @returns Array of drawer section configurations
 */
export const getDrawerSections = (options?: {
  includeOfficeLink?: boolean;
  assessmentStatus?: AssessmentStatus;
  includeTeamManagementLink?: boolean;
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
