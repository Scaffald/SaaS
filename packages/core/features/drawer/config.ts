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
 * @param options.includeOfficeLink - Whether to include the Office link (for admin users)
 * @param options.assessmentStatus - Assessment completion status for checkmarks
 * @returns Array of drawer item configurations
 */
export const generateDashboardDrawerItems = (options?: {
  includeOfficeLink?: boolean;
  assessmentStatus?: AssessmentStatus;
}): DrawerItemConfig[] => {
  const items: DrawerItemConfig[] = [];

  // Office section (for admin users only) - Make expandable with Users and Jobs
  if (options?.includeOfficeLink) {
    const officeSubItems: DrawerItemConfig[] = [
      {
        key: "office-users",
        title: ROUTES.OFFICE_USERS.title,
        href: ROUTES.OFFICE_USERS.path,
      },
      {
        key: "office-jobs",
        title: ROUTES.OFFICE_JOBS.title,
        href: ROUTES.OFFICE_JOBS.path,
      },
      {
        key: "office-universities",
        title: ROUTES.OFFICE_UNIVERSITIES.title,
        href: ROUTES.OFFICE_UNIVERSITIES.path,
      },
      {
        key: "office-applications",
        title: ROUTES.OFFICE_APPLICATIONS.title,
        href: ROUTES.OFFICE_APPLICATIONS.path,
      },
      {
        key: "office-organizations",
        title: ROUTES.OFFICE_ORGANIZATIONS.title,
        href: ROUTES.OFFICE_ORGANIZATIONS.path,
      },
      {
        key: "office-notifications",
        title: ROUTES.OFFICE_NOTIFICATIONS.title,
        href: ROUTES.OFFICE_NOTIFICATIONS.path,
      },
      {
        key: "office-cms",
        title: ROUTES.OFFICE_CMS.title,
        href: ROUTES.OFFICE_CMS.path,
      },
      {
        key: "office-styleguide",
        title: ROUTES.STYLEGUIDE.title,
        href: ROUTES.STYLEGUIDE.path,
      },
    ];

    items.push({
      key: "office",
      title: "Office",
      href: ROUTES.OFFICE.path,
      icon: Building2,
      isExpandable: true,
      subItems: officeSubItems,
    });
  }

  // Main dashboard item
  items.push({
    key: "dashboard",
    title: ROUTES.DASHBOARD.title,
    href: ROUTES.DASHBOARD.path,
    icon: BarChart3,
  });

  // Discover route - Always show subItems, parent is clickable
  items.push({
    key: "discover",
    title: "Discover",
    href: ROUTES.DASHBOARD_DISCOVER_MAP.path,
    icon: MapIcon,
    subItems: [
      {
        key: "discover-map",
        title: ROUTES.DASHBOARD_DISCOVER_MAP.title,
        href: ROUTES.DASHBOARD_DISCOVER_MAP.path,
      },
      {
        key: "discover-workers",
        title: ROUTES.DASHBOARD_DISCOVER_WORKERS.title,
        href: ROUTES.DASHBOARD_DISCOVER_WORKERS.path,
      },
      {
        key: "discover-employers",
        title: ROUTES.DASHBOARD_DISCOVER_EMPLOYERS.title,
        href: ROUTES.DASHBOARD_DISCOVER_EMPLOYERS.path,
      },
      {
        key: "discover-jobs",
        title: ROUTES.DASHBOARD_DISCOVER_JOBS.title,
        href: ROUTES.DASHBOARD_DISCOVER_JOBS.path,
      },
    ],
  });

  // Profile route - Always show subItems, parent is clickable
  items.push({
    key: "profile",
    title: "Profile",
    href: ROUTES.DASHBOARD_PROFILE.path,
    icon: User,
    subItems: [
      {
        key: "profile-general",
        title: ROUTES.DASHBOARD_PROFILE_GENERAL.title,
        href: ROUTES.DASHBOARD_PROFILE_GENERAL.path,
      },
      {
        key: "profile-employment",
        title: ROUTES.DASHBOARD_PROFILE_EMPLOYMENT.title,
        href: ROUTES.DASHBOARD_PROFILE_EMPLOYMENT.path,
      },
      {
        key: "profile-skills",
        title: ROUTES.DASHBOARD_PROFILE_SKILLS.title,
        href: ROUTES.DASHBOARD_PROFILE_SKILLS.path,
      },
      {
        key: "profile-certifications",
        title: ROUTES.DASHBOARD_PROFILE_CERTIFICATIONS.title,
        href: ROUTES.DASHBOARD_PROFILE_CERTIFICATIONS.path,
      },
      {
        key: "profile-education",
        title: ROUTES.DASHBOARD_PROFILE_EDUCATION.title,
        href: ROUTES.DASHBOARD_PROFILE_EDUCATION.path,
      },
      {
        key: "profile-experience",
        title: ROUTES.DASHBOARD_PROFILE_EXPERIENCE.title,
        href: ROUTES.DASHBOARD_PROFILE_EXPERIENCE.path,
      },
    ],
  });

  // Assessments route - Always show sub-items for each assessment
  const assessmentSubItems: DrawerItemConfig[] = [
    {
      key: "assessment-pulse",
      title: ROUTES.DASHBOARD_ASSESSMENT_LUSCHER_1.title,
      href: ROUTES.DASHBOARD_ASSESSMENT_LUSCHER_1.path,
      isCompleted: options?.assessmentStatus?.luscher1.isCompleted,
      isOnCooldown: options?.assessmentStatus?.luscher1.isOnCooldown,
    },
    {
      key: "assessment-ipip",
      title: ROUTES.DASHBOARD_ASSESSMENT_IPIP.title,
      href: ROUTES.DASHBOARD_ASSESSMENT_IPIP.path,
      isCompleted: options?.assessmentStatus?.ipip.isCompleted,
    },
    {
      key: "assessment-riasec",
      title: ROUTES.DASHBOARD_ASSESSMENT_RIASEC.title,
      href: ROUTES.DASHBOARD_ASSESSMENT_RIASEC.path,
      isCompleted: options?.assessmentStatus?.riasec.isCompleted,
    },
    {
      key: "assessment-occupation",
      title: ROUTES.DASHBOARD_ASSESSMENT_OCCUPATION.title,
      href: ROUTES.DASHBOARD_ASSESSMENT_OCCUPATION.path,
      isCompleted: options?.assessmentStatus?.occupation.isCompleted,
    },
  ];

  items.push({
    key: "assessments",
    title: "Assessments",
    href: ROUTES.DASHBOARD_ASSESSMENTS.path,
    icon: ClipboardCheck,
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
