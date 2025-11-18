/**
 * Type-Safe Application Route Configuration
 *
 * This system provides:
 * - Zero hardcoded route strings
 * - Strongly-typed route access (no optional chaining needed)
 * - Dynamic route builders for parameterized paths
 * - Compile-time route validation
 * - Centralized route management
 */

import type { ComponentType } from "react";
import {
  Bell,
  Briefcase,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  HardDrive,
  Palette,
  ShieldCheck,
  Users,
} from "@tamagui/lucide-icons";

// ============================================================================
// Types
// ============================================================================

export type RouteParams = Record<string, string | number>;

export interface RouteConfig {
  readonly path: string;
  readonly title: string;
  readonly description?: string;
  readonly isProtected?: boolean;
  readonly isAuth?: boolean;
  // Flyout menu metadata
  readonly menuCategory?: "content" | "recruitment" | "management" | "system";
  readonly menuOrder?: number;
  readonly menuIcon?: ComponentType;
  readonly menuParent?: string;
}

// ============================================================================
// Route Definitions
// ============================================================================

const ROUTES_CONFIG = {
  // Root
  HOME: {
    path: "/",
    title: "Home",
  },

  STYLEGUIDE: {
    path: "/styleguide",
    title: "Styleguide",
    menuCategory: "system",
    menuOrder: 3,
    menuIcon: Palette,
  },

  // Auth Routes
  AUTH: {
    path: "/auth",
    title: "Sign In",
    isAuth: true,
  },
  AUTH_CONFIRM: {
    path: "/auth/confirm",
    title: "Confirm Account",
    isAuth: true,
  },
  AUTH_SUCCESS: {
    path: "/auth/success",
    title: "Success",
    isAuth: true,
  },

  // Dashboard Routes
  DASHBOARD: {
    path: "/dashboard",
    title: "Dashboard",
    isProtected: true,
  },
  DASHBOARD_NOTIFICATIONS: {
    path: "/dashboard/settings/notifications",
    title: "Notifications",
    isProtected: true,
  },

  // Dashboard > Profile
  DASHBOARD_PROFILE: {
    path: "/dashboard/profile",
    title: "Profile",
    isProtected: true,
  },
  DASHBOARD_PROFILE_GENERAL: {
    path: "/dashboard/profile/general",
    title: "General",
    isProtected: true,
  },
  DASHBOARD_PROFILE_EMPLOYMENT: {
    path: "/dashboard/profile/employment",
    title: "Employment",
    isProtected: true,
  },
  DASHBOARD_PROFILE_SKILLS: {
    path: "/dashboard/profile/skills",
    title: "Skills",
    isProtected: true,
  },
  DASHBOARD_PROFILE_CERTIFICATIONS: {
    path: "/dashboard/profile/certifications",
    title: "Certifications",
    isProtected: true,
  },
  DASHBOARD_PROFILE_IMPORT_REVIEW: {
    path: "/dashboard/profile/import-review",
    title: "Import Review",
    isProtected: true,
  },
  DASHBOARD_PROFILE_EDUCATION: {
    path: "/dashboard/profile/education",
    title: "Education",
    isProtected: true,
  },
  DASHBOARD_PROFILE_EXPERIENCE: {
    path: "/dashboard/profile/experience",
    title: "Experience",
    isProtected: true,
  },
  DASHBOARD_PROFILE_BACKGROUND_CHECK: {
    path: "/dashboard/profile/background-check",
    title: "Background Checks",
    isProtected: true,
  },
  DASHBOARD_PROFILE_BACKGROUND_CHECK_INITIATE: {
    path: "/dashboard/profile/background-check/initiate",
    title: "Start Background Check",
    isProtected: true,
  },
  DASHBOARD_PROFILE_BACKGROUND_CHECK_DISPUTE: {
    path: "/dashboard/profile/background-check/:checkId/dispute",
    title: "Dispute Background Check",
    isProtected: true,
  },

  // Dashboard > Settings
  DASHBOARD_SETTINGS: {
    path: "/dashboard/settings",
    title: "Settings",
    isProtected: true,
  },
  DASHBOARD_SETTINGS_GENERAL: {
    path: "/dashboard/settings/general",
    title: "General Settings",
    isProtected: true,
  },
  DASHBOARD_SETTINGS_SECURITY: {
    path: "/dashboard/settings/security",
    title: "Security Settings",
    isProtected: true,
  },
  DASHBOARD_SETTINGS_AUTHENTICATION: {
    path: "/dashboard/settings/authentication",
    title: "Authentication Settings",
    isProtected: true,
  },

  // Dashboard > Map
  DASHBOARD_DISCOVER_MAP: {
    path: "/dashboard/map",
    title: "Map",
    isProtected: true,
  },
  // Dashboard > Workers
  DASHBOARD_DISCOVER_WORKERS: {
    path: "/dashboard/workers",
    title: "Workers",
    isProtected: true,
  },
  DASHBOARD_DISCOVER_WORKER_DETAIL: {
    path: "/dashboard/workers/:id",
    title: "Worker Details",
    isProtected: true,
  },
  // Dashboard > Employers
  DASHBOARD_DISCOVER_EMPLOYERS: {
    path: "/dashboard/employers",
    title: "Employers",
    isProtected: true,
  },
  DASHBOARD_DISCOVER_EMPLOYER_DETAIL: {
    path: "/dashboard/employers/:id",
    title: "Employer Details",
    isProtected: true,
  },
  // Dashboard > Jobs
  DASHBOARD_DISCOVER_JOBS: {
    path: "/dashboard/jobs",
    title: "Jobs",
    isProtected: true,
  },
  DASHBOARD_DISCOVER_JOB_DETAIL: {
    path: "/dashboard/jobs/:id",
    title: "Job Details",
    isProtected: true,
  },
  DASHBOARD_ORGANIZATIONS_CREATE: {
    path: "/dashboard/organizations/create",
    title: "Request Organization",
    isProtected: true,
  },
  DASHBOARD_TEAMS: {
    path: "/dashboard/teams",
    title: "Teams",
    isProtected: true,
  },
  DASHBOARD_TEAM_DETAIL: {
    path: "/dashboard/teams/:teamId",
    title: "Team Details",
    isProtected: true,
  },
  DASHBOARD_TEAMS_INVITATIONS: {
    path: "/dashboard/teams/invitations",
    title: "Team Invitations",
    isProtected: true,
  },
  DASHBOARD_WORK_LOGS: {
    path: "/dashboard/work-logs",
    title: "Work Logs",
    isProtected: true,
  },
  DASHBOARD_WORK_LOGS_CREATE: {
    path: "/dashboard/work-logs/create",
    title: "Create Work Log",
    isProtected: true,
  },
  DASHBOARD_WORK_LOGS_DETAIL: {
    path: "/dashboard/work-logs/:workLogId",
    title: "Work Log Detail",
    isProtected: true,
  },

  DASHBOARD_APPLICATIONS: {
    path: "/dashboard/applications",
    title: "Applications",
    isProtected: true,
  },
  DASHBOARD_APPLICATION_INQUIRY: {
    path: "/dashboard/applications/:applicationId/inquiry",
    title: "Inquiry",
    isProtected: true,
  },

  // Dashboard > Users (dynamic)
  DASHBOARD_USER: {
    path: "/dashboard/users/:userId",
    title: "User Profile",
    isProtected: true,
  },

  // Dashboard > Assessments
  DASHBOARD_ASSESSMENTS: {
    path: "/dashboard/assessments",
    title: "Assessments",
    isProtected: true,
  },
  // Dashboard > Assessments > Personality Tests
  DASHBOARD_ASSESSMENT_LUSCHER: {
    path: "/dashboard/assessments/pulse",
    title: "Weekly Pulse",
    isProtected: true,
  },
  DASHBOARD_ASSESSMENT_IPIP: {
    path: "/dashboard/assessments/ipip",
    title: "Personality",
    isProtected: true,
  },
  // Dashboard > Assessments > Career Tests
  DASHBOARD_ASSESSMENT_RIASEC: {
    path: "/dashboard/assessments/riasec",
    title: "Career Interests",
    isProtected: true,
  },
  DASHBOARD_ASSESSMENT_OCCUPATION: {
    path: "/dashboard/assessments/occupation",
    title: "Occupation Preferences",
    isProtected: true,
  },

  // Office Routes
  OFFICE: {
    path: "/office",
    title: "Office",
    isProtected: true,
  },
  OFFICE_CMS: {
    path: "/office/cms",
    title: "Content Management",
    isProtected: true,
  },
  OFFICE_NOTIFICATIONS: {
    path: "/office/notifications",
    title: "Notifications",
    isProtected: true,
    menuCategory: "system",
    menuOrder: 1,
    menuIcon: Bell,
  },
  OFFICE_STORAGE: {
    path: "/office/storage",
    title: "Storage Analytics",
    isProtected: true,
    menuCategory: "system",
    menuOrder: 2,
    menuIcon: HardDrive,
  },
  OFFICE_SETTINGS: {
    path: "/office/settings",
    title: "Office Settings",
    isProtected: true,
    menuCategory: "system",
    menuOrder: 4,
    menuIcon: ShieldCheck,
  },
  OFFICE_SETTINGS_GEOGRAPHIC: {
    path: "/office/settings/geographic",
    title: "Geographic Settings",
    isProtected: true,
    menuCategory: "system",
    menuParent: "OFFICE_SETTINGS",
  },
  OFFICE_SETTINGS_STRIPE: {
    path: "/office/settings/stripe",
    title: "Stripe Payments",
    isProtected: true,
    menuCategory: "system",
    menuParent: "OFFICE_SETTINGS",
  },
  OFFICE_APPLICATIONS: {
    path: "/office/applications",
    title: "Applications",
    isProtected: true,
    menuCategory: "recruitment",
    menuOrder: 1,
    menuIcon: ClipboardCheck,
  },
  OFFICE_APPLICATION_INQUIRY: {
    path: "/office/applications/:applicationId/inquiry",
    title: "Inquiry Detail",
    isProtected: true,
    menuCategory: "recruitment",
    menuParent: "OFFICE_APPLICATIONS",
  },
  OFFICE_ATS: {
    path: "/office/ats",
    title: "Applications",
    isProtected: true,
    menuCategory: "recruitment",
    menuOrder: 1,
    menuIcon: ClipboardCheck,
  },
  OFFICE_ATS_DETAIL: {
    path: "/office/ats/:id",
    title: "Application Detail",
    isProtected: true,
    menuCategory: "recruitment",
    menuParent: "OFFICE_ATS",
  },
  OFFICE_ATS_CHECKS: {
    path: "/office/ats/checks",
    title: "Background Checks",
    isProtected: true,
    menuCategory: "recruitment",
    menuOrder: 2,
    menuIcon: ShieldCheck,
  },
  OFFICE_ATS_CHECKS_ADMIN: {
    path: "/office/ats/admin",
    title: "Review Background Checks",
    isProtected: true,
    menuCategory: "recruitment",
    menuParent: "OFFICE_ATS_CHECKS",
  },
  OFFICE_ATS_CHECKS_REQUEST: {
    path: "/office/ats/request",
    title: "Request Background Check",
    isProtected: true,
    menuCategory: "recruitment",
    menuParent: "OFFICE_ATS_CHECKS",
  },
  OFFICE_CMS_WORKERS: {
    path: "/office/cms/workers",
    title: "Workers",
    isProtected: true,
    menuCategory: "content",
    menuOrder: 2,
    menuIcon: Users,
  },
  OFFICE_CMS_WORKERS_CREATE: {
    path: "/office/cms/workers/create",
    title: "Create Worker",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_WORKERS",
  },
  OFFICE_CMS_WORKERS_EDIT: {
    path: "/office/cms/workers/:id/edit",
    title: "Edit Worker",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_WORKERS",
  },
  OFFICE_CMS_JOBS: {
    path: "/office/cms/jobs",
    title: "Jobs",
    isProtected: true,
    menuCategory: "content",
    menuOrder: 3,
    menuIcon: Briefcase,
  },
  OFFICE_CMS_JOBS_CREATE: {
    path: "/office/cms/jobs/create",
    title: "Create Job",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_JOBS",
  },
  OFFICE_CMS_JOBS_EDIT: {
    path: "/office/cms/jobs/:id/edit",
    title: "Edit Job",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_JOBS",
  },
  OFFICE_CMS_UNIVERSITIES: {
    path: "/office/cms/universities",
    title: "Universities",
    isProtected: true,
    menuCategory: "content",
    menuOrder: 6,
    menuIcon: GraduationCap,
  },
  OFFICE_CMS_UNIVERSITIES_CREATE: {
    path: "/office/cms/universities/create",
    title: "Create University",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_UNIVERSITIES",
  },
  OFFICE_CMS_UNIVERSITIES_EDIT: {
    path: "/office/cms/universities/:id/edit",
    title: "Edit University",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_UNIVERSITIES",
  },
  OFFICE_CMS_ORGANIZATIONS: {
    path: "/office/cms/organizations",
    title: "Organizations",
    isProtected: true,
    menuCategory: "content",
    menuOrder: 4,
    menuIcon: Building2,
  },
  OFFICE_CMS_ORGANIZATIONS_CREATE: {
    path: "/office/cms/organizations/create",
    title: "Create Organization",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_ORGANIZATIONS",
  },
  OFFICE_CMS_ORGANIZATIONS_EDIT: {
    path: "/office/cms/organizations/:id/edit",
    title: "Edit Organization",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_ORGANIZATIONS",
  },
  OFFICE_CMS_TEAMS: {
    path: "/office/cms/teams",
    title: "Teams",
    isProtected: true,
    menuCategory: "content",
    menuOrder: 5,
    menuIcon: Users,
  },
  OFFICE_CMS_TEAMS_CREATE: {
    path: "/office/cms/teams/create",
    title: "Create Team",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_TEAMS",
  },
  OFFICE_CMS_TEAMS_DETAIL: {
    path: "/office/cms/teams/:id",
    title: "Team Detail",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_TEAMS",
  },
  OFFICE_CMS_TEAMS_EDIT: {
    path: "/office/cms/teams/:id/edit",
    title: "Edit Team",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_TEAMS_DETAIL",
  },
  OFFICE_CMS_TEAMS_ANALYTICS: {
    path: "/office/cms/teams/:id/analytics",
    title: "Team Analytics",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_TEAMS_DETAIL",
  },
  OFFICE_CMS_TEAMS_SETTINGS: {
    path: "/office/cms/teams/:id/settings",
    title: "Team Settings",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_TEAMS_DETAIL",
  },
  OFFICE_CMS_PROJECTS: {
    path: "/office/cms/projects",
    title: "Projects",
    isProtected: true,
    menuCategory: "content",
    menuOrder: 7,
    menuIcon: ClipboardCheck,
  },
  OFFICE_CMS_PROJECTS_CREATE: {
    path: "/office/cms/projects/create",
    title: "Create Project",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_PROJECTS",
  },
  OFFICE_CMS_PROJECTS_DETAIL: {
    path: "/office/cms/projects/:id",
    title: "Project Detail",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_PROJECTS",
  },
  OFFICE_CMS_PROJECTS_EDIT: {
    path: "/office/cms/projects/:id/edit",
    title: "Edit Project",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_PROJECTS_DETAIL",
  },
  OFFICE_CMS_WELCOME: {
    path: "/office/cms/welcome",
    title: "Welcome Slides",
    isProtected: true,
    menuCategory: "content",
    menuOrder: 1,
    menuIcon: FileText,
  },
  OFFICE_CMS_WELCOME_CREATE: {
    path: "/office/cms/welcome/create",
    title: "Create Slide",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_WELCOME",
  },
  OFFICE_CMS_WELCOME_EDIT: {
    path: "/office/cms/welcome/:id/edit",
    title: "Edit Slide",
    isProtected: true,
    menuCategory: "content",
    menuParent: "OFFICE_CMS_WELCOME",
  },
} as const satisfies Record<string, RouteConfig>;

// ============================================================================
// Strongly-Typed Routes Object
// ============================================================================

export const ROUTES = ROUTES_CONFIG;

// ============================================================================
// Dynamic Route Builders
// ============================================================================

/**
 * Build a route with dynamic parameters
 * @example buildRoute(ROUTES.OFFICE_CMS_JOBS_EDIT, { id: 123 }) => '/office/cms/jobs/123/edit'
 */
export function buildRoute(
  route: RouteConfig,
  params: RouteParams = {},
): string {
  let path = route.path;

  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, String(value));
  }

  return path;
}

/**
 * Type-safe route builders for common dynamic routes
 */
export const RouteBuilder = {
  // Office routes
  officeUsersEdit: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_CMS_WORKERS_EDIT, { id }),
  officeJobsEdit: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_CMS_JOBS_EDIT, { id }),
  officeUniversitiesEdit: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_CMS_UNIVERSITIES_EDIT, { id }),
  officeTeamsEdit: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_CMS_TEAMS_EDIT, { id }),
  officeTeamsDetail: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_CMS_TEAMS_DETAIL, { id }),
  officeTeamsAnalytics: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_CMS_TEAMS_ANALYTICS, { id }),
  officeTeamsSettings: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_CMS_TEAMS_SETTINGS, { id }),
  projectEdit: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_CMS_PROJECTS_EDIT, { id }),
  projectDetail: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_CMS_PROJECTS_DETAIL, { id }),
  officeBackgroundChecksRequest: () => ROUTES.OFFICE_ATS_CHECKS_REQUEST.path,
  officeBackgroundChecksAdmin: () => ROUTES.OFFICE_ATS_CHECKS_ADMIN.path,
  officeStorage: () => ROUTES.OFFICE_STORAGE.path,
  dashboardBackgroundCheck: () =>
    ROUTES.DASHBOARD_PROFILE_BACKGROUND_CHECK.path,
  dashboardBackgroundCheckInitiate: () =>
    ROUTES.DASHBOARD_PROFILE_BACKGROUND_CHECK_INITIATE.path,
  dashboardBackgroundCheckDispute: (checkId: string | number) =>
    buildRoute(ROUTES.DASHBOARD_PROFILE_BACKGROUND_CHECK_DISPUTE, {
      checkId,
    }),

  // Dashboard routes
  dashboardUser: (userId: string | number) =>
    buildRoute(ROUTES.DASHBOARD_USER, { userId }),
  discoverWorkerDetail: (id: string | number) =>
    buildRoute(ROUTES.DASHBOARD_DISCOVER_WORKER_DETAIL, { id }),
  discoverJobDetail: (id: string | number) =>
    buildRoute(ROUTES.DASHBOARD_DISCOVER_JOB_DETAIL, { id }),
  dashboardEmployer: (id: string | number) =>
    buildRoute(ROUTES.DASHBOARD_DISCOVER_EMPLOYER_DETAIL, { id }),
  dashboardOrganizationCreate: () => ROUTES.DASHBOARD_ORGANIZATIONS_CREATE.path,
  dashboardTeams: () => ROUTES.DASHBOARD_TEAMS.path,
  dashboardTeamDetail: (teamId: string | number) =>
    buildRoute(ROUTES.DASHBOARD_TEAM_DETAIL, { teamId }),
  dashboardTeamsInvitations: () => ROUTES.DASHBOARD_TEAMS_INVITATIONS.path,
  dashboardWorkLogs: () => ROUTES.DASHBOARD_WORK_LOGS.path,
  dashboardWorkLogDetail: (workLogId: string | number) =>
    buildRoute(ROUTES.DASHBOARD_WORK_LOGS_DETAIL, { workLogId }),
  dashboardWorkLogCreate: () => ROUTES.DASHBOARD_WORK_LOGS_CREATE.path,
} as const;

// ============================================================================
// Navigation Hierarchy
// ============================================================================

export type RouteHierarchyNode = {
  key: keyof typeof ROUTES;
  children?: readonly RouteHierarchyNode[];
};

export const ROUTE_HIERARCHY: readonly RouteHierarchyNode[] = [
  {
    key: "DASHBOARD",
    children: [
      {
        key: "DASHBOARD_PROFILE",
        children: [
          { key: "DASHBOARD_PROFILE_GENERAL" },
          { key: "DASHBOARD_PROFILE_EMPLOYMENT" },
          { key: "DASHBOARD_PROFILE_SKILLS" },
          { key: "DASHBOARD_PROFILE_CERTIFICATIONS" },
          { key: "DASHBOARD_PROFILE_IMPORT_REVIEW" },
          { key: "DASHBOARD_PROFILE_EDUCATION" },
          { key: "DASHBOARD_PROFILE_EXPERIENCE" },
          {
            key: "DASHBOARD_PROFILE_BACKGROUND_CHECK",
            children: [
              { key: "DASHBOARD_PROFILE_BACKGROUND_CHECK_INITIATE" },
              { key: "DASHBOARD_PROFILE_BACKGROUND_CHECK_DISPUTE" },
            ],
          },
        ],
      },
      {
        key: "DASHBOARD_SETTINGS",
        children: [
          { key: "DASHBOARD_SETTINGS_GENERAL" },
          { key: "DASHBOARD_SETTINGS_SECURITY" },
          { key: "DASHBOARD_SETTINGS_AUTHENTICATION" },
          { key: "DASHBOARD_NOTIFICATIONS" },
        ],
      },
      { key: "DASHBOARD_DISCOVER_MAP" },
      {
        key: "DASHBOARD_DISCOVER_WORKERS",
        children: [{ key: "DASHBOARD_DISCOVER_WORKER_DETAIL" }],
      },
      {
        key: "DASHBOARD_DISCOVER_EMPLOYERS",
        children: [{ key: "DASHBOARD_DISCOVER_EMPLOYER_DETAIL" }],
      },
      {
        key: "DASHBOARD_DISCOVER_JOBS",
        children: [{ key: "DASHBOARD_DISCOVER_JOB_DETAIL" }],
      },
      {
        key: "DASHBOARD_ASSESSMENTS",
        children: [
          { key: "DASHBOARD_ASSESSMENT_LUSCHER" },
          { key: "DASHBOARD_ASSESSMENT_IPIP" },
          { key: "DASHBOARD_ASSESSMENT_RIASEC" },
          { key: "DASHBOARD_ASSESSMENT_OCCUPATION" },
        ],
      },
      {
        key: "DASHBOARD_TEAMS",
        children: [
          { key: "DASHBOARD_TEAMS_INVITATIONS" },
          { key: "DASHBOARD_TEAM_DETAIL" },
        ],
      },
      {
        key: "DASHBOARD_WORK_LOGS",
        children: [
          { key: "DASHBOARD_WORK_LOGS_CREATE" },
          { key: "DASHBOARD_WORK_LOGS_DETAIL" },
        ],
      },
      { key: "DASHBOARD_ORGANIZATIONS_CREATE" },
      { key: "DASHBOARD_USER" },
    ],
  },
  {
    key: "OFFICE",
    children: [
      {
        key: "OFFICE_CMS",
        children: [
          {
            key: "OFFICE_CMS_WELCOME",
            children: [
              { key: "OFFICE_CMS_WELCOME_CREATE" },
              { key: "OFFICE_CMS_WELCOME_EDIT" },
            ],
          },
          {
            key: "OFFICE_CMS_WORKERS",
            children: [
              { key: "OFFICE_CMS_WORKERS_CREATE" },
              { key: "OFFICE_CMS_WORKERS_EDIT" },
            ],
          },
          {
            key: "OFFICE_CMS_JOBS",
            children: [
              { key: "OFFICE_CMS_JOBS_CREATE" },
              { key: "OFFICE_CMS_JOBS_EDIT" },
            ],
          },
          {
            key: "OFFICE_CMS_ORGANIZATIONS",
            children: [
              { key: "OFFICE_CMS_ORGANIZATIONS_CREATE" },
              { key: "OFFICE_CMS_ORGANIZATIONS_EDIT" },
            ],
          },
          {
            key: "OFFICE_CMS_TEAMS",
            children: [
              { key: "OFFICE_CMS_TEAMS_CREATE" },
              {
                key: "OFFICE_CMS_TEAMS_DETAIL",
                children: [
                  { key: "OFFICE_CMS_TEAMS_EDIT" },
                  { key: "OFFICE_CMS_TEAMS_ANALYTICS" },
                  { key: "OFFICE_CMS_TEAMS_SETTINGS" },
                ],
              },
            ],
          },
          {
            key: "OFFICE_CMS_PROJECTS",
            children: [
              { key: "OFFICE_CMS_PROJECTS_CREATE" },
              {
                key: "OFFICE_CMS_PROJECTS_DETAIL",
                children: [
                  { key: "OFFICE_CMS_PROJECTS_EDIT" },
                ],
              },
            ],
          },
          {
            key: "OFFICE_CMS_UNIVERSITIES",
            children: [
              { key: "OFFICE_CMS_UNIVERSITIES_CREATE" },
              { key: "OFFICE_CMS_UNIVERSITIES_EDIT" },
            ],
          },
        ],
      },
      {
        key: "OFFICE_ATS",
        children: [
          { key: "OFFICE_ATS_CHECKS" },
          { key: "OFFICE_ATS_CHECKS_REQUEST" },
          { key: "OFFICE_ATS_CHECKS_ADMIN" },
          { key: "OFFICE_ATS_DETAIL" },
        ],
      },
      { key: "OFFICE_NOTIFICATIONS" },
      { key: "OFFICE_STORAGE" },
      {
        key: "OFFICE_SETTINGS",
        children: [
          { key: "OFFICE_SETTINGS_GEOGRAPHIC" },
          { key: "OFFICE_SETTINGS_STRIPE" },
        ],
      },
    ],
  },
] as const;

// ============================================================================
// Legacy Compatibility (for gradual migration)
// ============================================================================

/**
 * @deprecated Use ROUTES directly instead
 */
export const AUTH_ROUTES = {
  INDEX: ROUTES.AUTH,
  CONFIRM: ROUTES.AUTH_CONFIRM,
  SUCCESS: ROUTES.AUTH_SUCCESS,
} as const;

/**
 * @deprecated Use ROUTES directly instead
 */
export const DASHBOARD_ROUTES = {
  INDEX: ROUTES.DASHBOARD,
  PROFILE: ROUTES.DASHBOARD_PROFILE,
  PROFILE_BACKGROUND_CHECK: ROUTES.DASHBOARD_PROFILE_BACKGROUND_CHECK,
  PROFILE_BACKGROUND_CHECK_INITIATE:
    ROUTES.DASHBOARD_PROFILE_BACKGROUND_CHECK_INITIATE,
  SETTINGS: ROUTES.DASHBOARD_SETTINGS,
  NOTIFICATIONS: ROUTES.DASHBOARD_NOTIFICATIONS,
  TEAMS: ROUTES.DASHBOARD_TEAMS,
  TEAM_DETAIL: ROUTES.DASHBOARD_TEAM_DETAIL,
  INVITATIONS: ROUTES.DASHBOARD_TEAMS_INVITATIONS,
  WORK_LOGS: ROUTES.DASHBOARD_WORK_LOGS,
  WORK_LOGS_CREATE: ROUTES.DASHBOARD_WORK_LOGS_CREATE,
  WORK_LOGS_DETAIL: ROUTES.DASHBOARD_WORK_LOGS_DETAIL,
  APPLICATIONS: ROUTES.DASHBOARD_APPLICATIONS,
  APPLICATION_INQUIRY: ROUTES.DASHBOARD_APPLICATION_INQUIRY,
} as const;

/**
 * @deprecated Use ROUTES directly instead
 */
export const OFFICE_ROUTES = {
  INDEX: ROUTES.OFFICE,
  USERS: ROUTES.OFFICE_CMS_WORKERS,
  JOBS: ROUTES.OFFICE_CMS_JOBS,
  TEAMS: ROUTES.OFFICE_CMS_TEAMS,
  TEAMS_DETAIL: ROUTES.OFFICE_CMS_TEAMS_DETAIL,
  TEAMS_ANALYTICS: ROUTES.OFFICE_CMS_TEAMS_ANALYTICS,
  TEAMS_SETTINGS: ROUTES.OFFICE_CMS_TEAMS_SETTINGS,
  PROJECTS: ROUTES.OFFICE_CMS_PROJECTS,
  PROJECTS_DETAIL: ROUTES.OFFICE_CMS_PROJECTS_DETAIL,
  PROJECTS_EDIT: ROUTES.OFFICE_CMS_PROJECTS_EDIT,
  UNIVERSITIES: ROUTES.OFFICE_CMS_UNIVERSITIES,
  BACKGROUND_CHECKS: ROUTES.OFFICE_ATS_CHECKS,
  BACKGROUND_CHECKS_ADMIN: ROUTES.OFFICE_ATS_CHECKS_ADMIN,
  NOTIFICATIONS: ROUTES.OFFICE_NOTIFICATIONS,
  SETTINGS: ROUTES.OFFICE_SETTINGS,
  SETTINGS_GEOGRAPHIC: ROUTES.OFFICE_SETTINGS_GEOGRAPHIC,
  SETTINGS_STRIPE: ROUTES.OFFICE_SETTINGS_STRIPE,
  APPLICATIONS: ROUTES.OFFICE_APPLICATIONS,
  APPLICATION_INQUIRY: ROUTES.OFFICE_APPLICATION_INQUIRY,
} as const;

// ============================================================================
// Route Helpers
// ============================================================================

/**
 * Check if a path is protected (requires authentication)
 */
export function isProtectedPath(path: string): boolean {
  return Object.values(ROUTES).some(
    (route) =>
      "isProtected" in route &&
      route.isProtected === true &&
      path.startsWith(route.path.split(":")[0]),
  );
}

/**
 * Check if a path is an auth path
 */
export function isAuthPath(path: string): boolean {
  return Object.values(ROUTES).some(
    (route) =>
      "isAuth" in route &&
      route.isAuth === true &&
      path.startsWith(route.path),
  );
}

/**
 * Check if a path matches a route (handles dynamic segments)
 */
export function matchesRoute(path: string, route: RouteConfig): boolean {
  const routePattern = route.path.replace(/:[^/]+/g, "[^/]+");
  const regex = new RegExp(`^${routePattern}$`);
  return regex.test(path);
}

/**
 * Check if current path is active (matches route or is a child)
 */
export function isActiveRoute(
  currentPath: string,
  route: RouteConfig,
): boolean {
  // Exact match
  if (currentPath === route.path) return true;

  // Handle dynamic routes
  if (matchesRoute(currentPath, route)) return true;

  // Check if current path is a child of this route
  const basePath = route.path.split(":")[0];
  return currentPath.startsWith(`${basePath}/`);
}

// ============================================================================
// Type Exports
// ============================================================================

export type RoutePath = typeof ROUTES[keyof typeof ROUTES]["path"];
export type RouteKey = keyof typeof ROUTES;
