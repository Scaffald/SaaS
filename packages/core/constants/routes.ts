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
    path: "/dashboard/notifications",
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

  // Dashboard > Discover
  DASHBOARD_DISCOVER_MAP: {
    path: "/dashboard/discover/map",
    title: "Map",
    isProtected: true,
  },
  DASHBOARD_DISCOVER_WORKERS: {
    path: "/dashboard/discover/workers",
    title: "Workers",
    isProtected: true,
  },
  DASHBOARD_DISCOVER_WORKER_DETAIL: {
    path: "/dashboard/discover/workers/:id",
    title: "Worker Details",
    isProtected: true,
  },
  DASHBOARD_DISCOVER_EMPLOYERS: {
    path: "/dashboard/discover/employers",
    title: "Employers",
    isProtected: true,
  },
  DASHBOARD_DISCOVER_EMPLOYER_DETAIL: {
    path: "/dashboard/discover/employers/:id",
    title: "Employer Details",
    isProtected: true,
  },
  DASHBOARD_DISCOVER_JOBS: {
    path: "/dashboard/discover/jobs",
    title: "Jobs",
    isProtected: true,
  },
  DASHBOARD_DISCOVER_JOB_DETAIL: {
    path: "/dashboard/discover/jobs/:id",
    title: "Job Details",
    isProtected: true,
  },
  DASHBOARD_ORGANIZATIONS_CREATE: {
    path: "/dashboard/organizations/create",
    title: "Request Organization",
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
  DASHBOARD_ASSESSMENT_LUSCHER_1: {
    path: "/dashboard/assessments/pulse",
    title: "Weekly Pulse",
    isProtected: true,
  },
  DASHBOARD_ASSESSMENT_IPIP: {
    path: "/dashboard/assessments/ipip",
    title: "Personality Questions",
    isProtected: true,
  },
  DASHBOARD_ASSESSMENT_LUSCHER_2: {
    path: "/dashboard/assessments/luscher-2",
    title: "Aspirational Color Test",
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
  // Dashboard > Assessment (Legacy - keep for backward compatibility)
  DASHBOARD_ASSESSMENT_PERSONALITY: {
    path: "/dashboard/assessment/personality",
    title: "Personality Assessment",
    isProtected: true,
  },

  // Office Routes
  OFFICE: {
    path: "/office",
    title: "Office",
    isProtected: true,
  },
  OFFICE_USERS: {
    path: "/office/users",
    title: "Manage Users",
    isProtected: true,
  },
  OFFICE_USERS_CREATE: {
    path: "/office/users/create",
    title: "Create User",
    isProtected: true,
  },
  OFFICE_USERS_EDIT: {
    path: "/office/users/:id/edit",
    title: "Edit User",
    isProtected: true,
  },
  OFFICE_JOBS: {
    path: "/office/jobs",
    title: "Manage Jobs",
    isProtected: true,
  },
  OFFICE_JOBS_CREATE: {
    path: "/office/jobs/create",
    title: "Create Job",
    isProtected: true,
  },
  OFFICE_JOBS_EDIT: {
    path: "/office/jobs/:id/edit",
    title: "Edit Job",
    isProtected: true,
  },
  OFFICE_UNIVERSITIES: {
    path: "/office/universities",
    title: "Manage Universities",
    isProtected: true,
  },
  OFFICE_UNIVERSITIES_CREATE: {
    path: "/office/universities/create",
    title: "Create University",
    isProtected: true,
  },
  OFFICE_UNIVERSITIES_EDIT: {
    path: "/office/universities/:id/edit",
    title: "Edit University",
    isProtected: true,
  },
  OFFICE_APPLICATIONS: {
    path: "/office/applications",
    title: "Applications",
    isProtected: true,
  },
  OFFICE_APPLICATIONS_DETAIL: {
    path: "/office/applications/:id",
    title: "Application Detail",
    isProtected: true,
  },
  OFFICE_ORGANIZATIONS: {
    path: "/office/organizations",
    title: "Organizations",
    isProtected: true,
  },
  OFFICE_NOTIFICATIONS: {
    path: "/office/notifications",
    title: "Notifications",
    isProtected: true,
  },
  OFFICE_ORGANIZATIONS_CREATE: {
    path: "/office/organizations/create",
    title: "Create Organization",
    isProtected: true,
  },
  OFFICE_ORGANIZATIONS_EDIT: {
    path: "/office/organizations/:id/edit",
    title: "Edit Organization",
    isProtected: true,
  },
  OFFICE_CMS: {
    path: "/office/cms",
    title: "CMS",
    isProtected: true,
  },
  OFFICE_CMS_CREATE: {
    path: "/office/cms/create",
    title: "Create Slide",
    isProtected: true,
  },
  OFFICE_CMS_EDIT: {
    path: "/office/cms/:id/edit",
    title: "Edit Slide",
    isProtected: true,
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
 * @example buildRoute(ROUTES.OFFICE_JOBS_EDIT, { id: 123 }) => '/office/jobs/123/edit'
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
    buildRoute(ROUTES.OFFICE_USERS_EDIT, { id }),
  officeJobsEdit: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_JOBS_EDIT, { id }),
  officeUniversitiesEdit: (id: string | number) =>
    buildRoute(ROUTES.OFFICE_UNIVERSITIES_EDIT, { id }),

  // Dashboard routes
  dashboardUser: (userId: string | number) =>
    buildRoute(ROUTES.DASHBOARD_USER, { userId }),
  discoverWorkerDetail: (id: string | number) =>
    buildRoute(ROUTES.DASHBOARD_DISCOVER_WORKER_DETAIL, { id }),
  discoverJobDetail: (id: string | number) =>
    buildRoute(ROUTES.DASHBOARD_DISCOVER_JOB_DETAIL, { id }),
  dashboardEmployer: (id: string | number) =>
    buildRoute(ROUTES.DASHBOARD_DISCOVER_EMPLOYER_DETAIL, { id }),
  dashboardOrganizationCreate: () =>
    ROUTES.DASHBOARD_ORGANIZATIONS_CREATE.path,
} as const;

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
  SETTINGS: ROUTES.DASHBOARD_SETTINGS,
  NOTIFICATIONS: ROUTES.DASHBOARD_NOTIFICATIONS,
} as const;

/**
 * @deprecated Use ROUTES directly instead
 */
export const OFFICE_ROUTES = {
  INDEX: ROUTES.OFFICE,
  USERS: ROUTES.OFFICE_USERS,
  JOBS: ROUTES.OFFICE_JOBS,
  UNIVERSITIES: ROUTES.OFFICE_UNIVERSITIES,
  NOTIFICATIONS: ROUTES.OFFICE_NOTIFICATIONS,
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
