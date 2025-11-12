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
  includeTeamManagementLink?: boolean;
}): DrawerItemConfig[] => {
  const items: DrawerItemConfig[] = [];

  // Office section (for admin users only) - Make expandable with Users and Jobs
  if (options?.includeOfficeLink) {
    const officeSubItems: DrawerItemConfig[] = [
      {
        key: "office-users",
        titleKey: "navigation.officeUsers",
        href: ROUTES.OFFICE_USERS.path,
      },
      {
        key: "office-jobs",
        titleKey: "navigation.officeJobs",
        href: ROUTES.OFFICE_JOBS.path,
      },
    ];

    if (options?.includeTeamManagementLink) {
      officeSubItems.splice(2, 0, {
        key: "office-teams",
        titleKey: "navigation.officeTeams",
        href: ROUTES.OFFICE_TEAMS.path,
        icon: Users,
      });
    }

    officeSubItems.push(
      {
        key: "office-universities",
        titleKey: "navigation.officeUniversities",
        href: ROUTES.OFFICE_UNIVERSITIES.path,
      },
      {
        key: "office-applications",
        titleKey: "navigation.officeApplications",
        href: ROUTES.OFFICE_APPLICATIONS.path,
      },
      {
        key: "office-organizations",
        titleKey: "navigation.officeOrganizations",
        href: ROUTES.OFFICE_ORGANIZATIONS.path,
      },
      {
        key: "office-background-checks",
        titleKey: "navigation.officeBackgroundChecks",
        href: ROUTES.OFFICE_BACKGROUND_CHECKS.path,
      },
      {
        key: "office-background-checks-admin",
        titleKey: "navigation.officeBackgroundChecksAdmin",
        href: ROUTES.OFFICE_BACKGROUND_CHECKS_ADMIN.path,
      },
      {
        key: "office-notifications",
        titleKey: "navigation.notifications",
        href: ROUTES.OFFICE_NOTIFICATIONS.path,
      },
      {
        key: "office-cms",
        titleKey: "navigation.officeCms",
        href: ROUTES.OFFICE_CMS.path,
      },
      {
        key: "office-styleguide",
        titleKey: "navigation.styleguide",
        href: ROUTES.STYLEGUIDE.path,
      },
    );

    items.push({
      key: "office",
      titleKey: "navigation.office",
      href: ROUTES.OFFICE.path,
      icon: Building2,
      isExpandable: true,
      subItems: officeSubItems,
    });
  }

  // Main dashboard item
  items.push({
    key: "dashboard",
    titleKey: "navigation.dashboard",
    href: ROUTES.DASHBOARD.path,
    icon: BarChart3,
  });

  // Discover route - Always show subItems, parent is clickable
  items.push({
    key: "discover",
    titleKey: "navigation.discover",
    href: ROUTES.DASHBOARD_DISCOVER_MAP.path,
    icon: MapIcon,
    subItems: [
      {
        key: "discover-map",
        titleKey: "navigation.discoverMap",
        href: ROUTES.DASHBOARD_DISCOVER_MAP.path,
      },
      {
        key: "discover-workers",
        titleKey: "navigation.discoverWorkers",
        href: ROUTES.DASHBOARD_DISCOVER_WORKERS.path,
      },
      {
        key: "discover-employers",
        titleKey: "navigation.discoverEmployers",
        href: ROUTES.DASHBOARD_DISCOVER_EMPLOYERS.path,
      },
      {
        key: "discover-jobs",
        titleKey: "navigation.discoverJobs",
        href: ROUTES.DASHBOARD_DISCOVER_JOBS.path,
      },
    ],
  });

  // Profile route - Always show subItems, parent is clickable
  items.push({
    key: "profile",
    titleKey: "navigation.profile",
    href: ROUTES.DASHBOARD_PROFILE.path,
    icon: User,
    subItems: [
      {
        key: "profile-general",
        titleKey: "navigation.profileGeneral",
        href: ROUTES.DASHBOARD_PROFILE_GENERAL.path,
      },
      {
        key: "profile-employment",
        titleKey: "navigation.profileEmployment",
        href: ROUTES.DASHBOARD_PROFILE_EMPLOYMENT.path,
      },
      {
        key: "profile-skills",
        titleKey: "navigation.profileSkills",
        href: ROUTES.DASHBOARD_PROFILE_SKILLS.path,
      },
      {
        key: "profile-certifications",
        titleKey: "navigation.profileCertifications",
        href: ROUTES.DASHBOARD_PROFILE_CERTIFICATIONS.path,
      },
      {
        key: "profile-education",
        titleKey: "navigation.profileEducation",
        href: ROUTES.DASHBOARD_PROFILE_EDUCATION.path,
      },
      {
        key: "profile-experience",
        titleKey: "navigation.profileExperience",
        href: ROUTES.DASHBOARD_PROFILE_EXPERIENCE.path,
      },
    ],
  });

  // Assessments route - Always show sub-items for each assessment
  const assessmentSubItems: DrawerItemConfig[] = [
    {
      key: "assessment-pulse",
      titleKey: "navigation.assessmentsPulse",
      href: ROUTES.DASHBOARD_ASSESSMENT_LUSCHER_1.path,
      isCompleted: options?.assessmentStatus?.luscher1.isCompleted,
      isOnCooldown: options?.assessmentStatus?.luscher1.isOnCooldown,
    },
    {
      key: "assessment-ipip",
      titleKey: "navigation.assessmentsPersonality",
      href: ROUTES.DASHBOARD_ASSESSMENT_IPIP.path,
      isCompleted: options?.assessmentStatus?.ipip.isCompleted,
    },
    {
      key: "assessment-riasec",
      titleKey: "navigation.assessmentsRiasec",
      href: ROUTES.DASHBOARD_ASSESSMENT_RIASEC.path,
      isCompleted: options?.assessmentStatus?.riasec.isCompleted,
    },
    {
      key: "assessment-occupation",
      titleKey: "navigation.assessmentsOccupation",
      href: ROUTES.DASHBOARD_ASSESSMENT_OCCUPATION.path,
      isCompleted: options?.assessmentStatus?.occupation.isCompleted,
    },
  ];

  items.push({
    key: "assessments",
    titleKey: "navigation.assessments",
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
