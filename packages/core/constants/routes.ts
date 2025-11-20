/**
 * Type-Safe Application Route Configuration
 *
 * This system provides:
 * - Zero hardcoded route strings
 * - Strongly-typed route access (no optional chaining needed)
 * - Dynamic route builders for parameterized paths
 * - Compile-time route validation
 * - Centralized route management
 * - Nested route structure for hierarchical organization
 */

import {
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileText,
  Fingerprint,
  GraduationCap,
  HardDrive,
  Palette,
  ShieldCheck,
  Users,
} from '@tamagui/lucide-icons'
import type { ComponentType } from 'react'

// ============================================================================
// Types
// ============================================================================

export type RouteParams = Record<string, string | number>

/**
 * Terminal route configuration (leaf node in the route tree)
 * Each terminal route represents an actual navigable page
 */
export interface RouteConfig {
  readonly path: string
  readonly title: string
  readonly description?: string
  readonly protected?: boolean
  readonly roles?: string[]
  readonly icon?: ComponentType
  readonly exact?: boolean
  readonly hidden?: boolean
}

/**
 * Route node type that supports both terminal routes and nested route groups
 */
export type RouteNode = RouteConfig | { [key: string]: RouteNode }

/**
 * Type guard to check if a route node is a terminal route
 */
function isRouteConfig(node: RouteNode): node is RouteConfig {
  return 'path' in node && typeof node.path === 'string'
}

// ============================================================================
// Route Definitions - Nested Structure
// ============================================================================

const ROUTES_CONFIG = {
  HOME: {
    path: '/',
    title: 'Home',
    protected: false,
    exact: true,
  },

  STYLEGUIDE: {
    path: '/styleguide',
    title: 'Styleguide',
    protected: false,
    exact: true,
    icon: Palette,
  },

  AUTH: {
    LOGIN: {
      path: '/auth',
      title: 'Sign In',
      protected: false,
      exact: true,
    },
    CONFIRM: {
      path: '/auth/confirm',
      title: 'Confirm Account',
      protected: false,
      exact: true,
    },
    SUCCESS: {
      path: '/auth/success',
      title: 'Success',
      protected: false,
      exact: true,
    },
  },

  DASHBOARD: {
    path: '/dashboard',
    title: 'Dashboard',
    protected: true,
    exact: false,
    PROFILE: {
      path: '/dashboard/profile',
      title: 'Profile',
      protected: true,
      exact: false,
      GENERAL: {
        path: '/dashboard/profile/general',
        title: 'General',
        protected: true,
        exact: true,
      },
      EMPLOYMENT: {
        path: '/dashboard/profile/employment',
        title: 'Employment',
        protected: true,
        exact: true,
      },
      SKILLS: {
        path: '/dashboard/profile/skills',
        title: 'Skills',
        protected: true,
        exact: true,
      },
      CERTIFICATIONS: {
        path: '/dashboard/profile/certifications',
        title: 'Certifications',
        protected: true,
        exact: true,
      },
      IMPORT_REVIEW: {
        path: '/dashboard/profile/import-review',
        title: 'Import Review',
        protected: true,
        exact: true,
      },
      EDUCATION: {
        path: '/dashboard/profile/education',
        title: 'Education',
        protected: true,
        exact: true,
      },
      EXPERIENCE: {
        path: '/dashboard/profile/experience',
        title: 'Experience',
        protected: true,
        exact: true,
      },
      ID_VERIFICATION: {
        path: '/dashboard/profile/id-verification',
        title: 'ID Verification',
        protected: true,
        exact: true,
      },
      BACKGROUND_CHECK: {
        path: '/dashboard/profile/background-check',
        title: 'Background Checks',
        protected: true,
        exact: false,
        INITIATE: {
          path: '/dashboard/profile/background-check/initiate',
          title: 'Start Background Check',
          protected: true,
          exact: true,
        },
        DISPUTE: {
          path: '/dashboard/profile/background-check/:checkId/dispute',
          title: 'Dispute Background Check',
          protected: true,
          exact: true,
        },
      },
    },
    SETTINGS: {
      path: '/dashboard/settings',
      title: 'Settings',
      protected: true,
      exact: false,
      GENERAL: {
        path: '/dashboard/settings/general',
        title: 'General Settings',
        protected: true,
        exact: true,
      },
      SECURITY: {
        path: '/dashboard/settings/security',
        title: 'Security Settings',
        protected: true,
        exact: true,
      },
      AUTHENTICATION: {
        path: '/dashboard/settings/authentication',
        title: 'Authentication Settings',
        protected: true,
        exact: true,
      },
      NOTIFICATIONS: {
        path: '/dashboard/settings/notifications',
        title: 'Notifications',
        protected: true,
        exact: true,
      },
    },
    DISCOVER: {
      MAP: {
        path: '/dashboard/map',
        title: 'Map',
        protected: true,
        exact: true,
      },
      WORKERS: {
        path: '/dashboard/workers',
        title: 'Workers',
        protected: true,
        exact: false,
        DETAIL: {
          path: '/dashboard/workers/:id',
          title: 'Worker Details',
          protected: true,
          exact: true,
        },
      },
      EMPLOYERS: {
        path: '/dashboard/employers',
        title: 'Employers',
        protected: true,
        exact: false,
        DETAIL: {
          path: '/dashboard/employers/:id',
          title: 'Employer Details',
          protected: true,
          exact: true,
        },
      },
      JOBS: {
        path: '/dashboard/jobs',
        title: 'Jobs',
        protected: true,
        exact: false,
        DETAIL: {
          path: '/dashboard/jobs/:id',
          title: 'Job Details',
          protected: true,
          exact: true,
        },
      },
    },
    ORGANIZATIONS: {
      CREATE: {
        path: '/dashboard/organizations/create',
        title: 'Request Organization',
        protected: true,
        exact: true,
      },
    },
    TEAMS: {
      path: '/dashboard/teams',
      title: 'Teams',
      protected: true,
      exact: false,
      INVITATIONS: {
        path: '/dashboard/teams/invitations',
        title: 'Team Invitations',
        protected: true,
        exact: true,
      },
      DETAIL: {
        path: '/dashboard/teams/:teamId',
        title: 'Team Details',
        protected: true,
        exact: true,
      },
    },
    WORK_LOGS: {
      path: '/dashboard/work-logs',
      title: 'Work Logs',
      protected: true,
      exact: false,
      CREATE: {
        path: '/dashboard/work-logs/create',
        title: 'Create Work Log',
        protected: true,
        exact: true,
      },
      DETAIL: {
        path: '/dashboard/work-logs/:workLogId',
        title: 'Work Log Detail',
        protected: true,
        exact: true,
      },
    },
    APPLICATIONS: {
      path: '/dashboard/applications',
      title: 'Applications',
      protected: true,
      exact: false,
      INQUIRY: {
        path: '/dashboard/applications/:applicationId/inquiry',
        title: 'Inquiry',
        protected: true,
        exact: true,
      },
    },
    USER: {
      path: '/dashboard/users/:userId',
      title: 'User Profile',
      protected: true,
      exact: true,
    },
    ASSESSMENTS: {
      path: '/dashboard/assessments',
      title: 'Assessments',
      protected: true,
      exact: false,
      LUSCHER: {
        path: '/dashboard/assessments/pulse',
        title: 'Weekly Pulse',
        protected: true,
        exact: true,
      },
      IPIP: {
        path: '/dashboard/assessments/ipip',
        title: 'Personality',
        protected: true,
        exact: true,
      },
      RIASEC: {
        path: '/dashboard/assessments/riasec',
        title: 'Career Interests',
        protected: true,
        exact: true,
      },
      OCCUPATION: {
        path: '/dashboard/assessments/occupation',
        title: 'Occupation Preferences',
        protected: true,
        exact: true,
      },
    },
  },

  OFFICE: {
    path: '/office',
    title: 'Office',
    protected: true,
    exact: false,
    CMS: {
      path: '/office/cms',
      title: 'Content Management',
      protected: true,
      exact: false,
      WELCOME: {
        path: '/office/cms/welcome',
        title: 'Welcome Slides',
        protected: true,
        exact: false,
        icon: FileText,
        CREATE: {
          path: '/office/cms/welcome/create',
          title: 'Create Slide',
          protected: true,
          exact: true,
        },
        EDIT: {
          path: '/office/cms/welcome/:id/edit',
          title: 'Edit Slide',
          protected: true,
          exact: true,
        },
      },
      WORKERS: {
        path: '/office/cms/workers',
        title: 'Workers',
        protected: true,
        exact: false,
        icon: Users,
        CREATE: {
          path: '/office/cms/workers/create',
          title: 'Create Worker',
          protected: true,
          exact: true,
        },
        EDIT: {
          path: '/office/cms/workers/:id/edit',
          title: 'Edit Worker',
          protected: true,
          exact: true,
        },
      },
      JOBS: {
        path: '/office/cms/jobs',
        title: 'Jobs',
        protected: true,
        exact: false,
        icon: Briefcase,
        CREATE: {
          path: '/office/cms/jobs/create',
          title: 'Create Job',
          protected: true,
          exact: true,
        },
        EDIT: {
          path: '/office/cms/jobs/:id/edit',
          title: 'Edit Job',
          protected: true,
          exact: true,
        },
      },
      ORGANIZATIONS: {
        path: '/office/cms/organizations',
        title: 'Organizations',
        protected: true,
        exact: false,
        icon: Building2,
        CREATE: {
          path: '/office/cms/organizations/create',
          title: 'Create Organization',
          protected: true,
          exact: true,
        },
        EDIT: {
          path: '/office/cms/organizations/:id/edit',
          title: 'Edit Organization',
          protected: true,
          exact: true,
        },
      },
      TEAMS: {
        path: '/office/cms/teams',
        title: 'Teams',
        protected: true,
        exact: false,
        icon: Users,
        CREATE: {
          path: '/office/cms/teams/create',
          title: 'Create Team',
          protected: true,
          exact: true,
        },
        DETAIL: {
          path: '/office/cms/teams/:id',
          title: 'Team Detail',
          protected: true,
          exact: false,
          EDIT: {
            path: '/office/cms/teams/:id/edit',
            title: 'Edit Team',
            protected: true,
            exact: true,
          },
          ANALYTICS: {
            path: '/office/cms/teams/:id/analytics',
            title: 'Team Analytics',
            protected: true,
            exact: true,
          },
          SETTINGS: {
            path: '/office/cms/teams/:id/settings',
            title: 'Team Settings',
            protected: true,
            exact: true,
          },
        },
      },
      PROJECTS: {
        path: '/office/cms/projects',
        title: 'Projects',
        protected: true,
        exact: false,
        icon: ClipboardCheck,
        CREATE: {
          path: '/office/cms/projects/create',
          title: 'Create Project',
          protected: true,
          exact: true,
        },
        DETAIL: {
          path: '/office/cms/projects/:id',
          title: 'Project Detail',
          protected: true,
          exact: false,
          EDIT: {
            path: '/office/cms/projects/:id/edit',
            title: 'Edit Project',
            protected: true,
            exact: true,
          },
        },
      },
      UNIVERSITIES: {
        path: '/office/cms/universities',
        title: 'Universities',
        protected: true,
        exact: false,
        icon: GraduationCap,
        CREATE: {
          path: '/office/cms/universities/create',
          title: 'Create University',
          protected: true,
          exact: true,
        },
        EDIT: {
          path: '/office/cms/universities/:id/edit',
          title: 'Edit University',
          protected: true,
          exact: true,
        },
      },
    },
    ATS: {
      path: '/office/ats',
      title: 'Applications',
      protected: true,
      exact: false,
      icon: ClipboardCheck,
      DETAIL: {
        path: '/office/ats/:id',
        title: 'Application Detail',
        protected: true,
        exact: true,
      },
      CHECKS: {
        path: '/office/ats/checks',
        title: 'Background Checks',
        protected: true,
        exact: false,
        icon: ShieldCheck,
        REQUEST: {
          path: '/office/ats/request',
          title: 'Request Background Check',
          protected: true,
          exact: true,
        },
        ADMIN: {
          path: '/office/ats/admin',
          title: 'Review Background Checks',
          protected: true,
          exact: true,
        },
      },
      ID_VERIFICATIONS: {
        path: '/office/ats/id-verifications',
        title: 'ID Verifications',
        protected: true,
        exact: true,
        icon: Fingerprint,
      },
    },
    APPLICATIONS: {
      path: '/office/applications',
      title: 'Applications',
      protected: true,
      exact: false,
      icon: ClipboardCheck,
      INQUIRY: {
        path: '/office/applications/:applicationId/inquiry',
        title: 'Inquiry Detail',
        protected: true,
        exact: true,
      },
    },
    NOTIFICATIONS: {
      path: '/office/notifications',
      title: 'Notifications',
      protected: true,
      exact: true,
      icon: Bell,
    },
    STORAGE: {
      path: '/office/storage',
      title: 'Storage Analytics',
      protected: true,
      exact: true,
      icon: HardDrive,
    },
    PAYMENTS: {
      path: '/office/payments',
      title: 'Payment Analytics',
      protected: true,
      exact: true,
      icon: CreditCard,
    },
    TRANSACTIONS: {
      path: '/office/transactions',
      title: 'Transaction History',
      protected: true,
      exact: true,
      icon: FileText,
    },
    VIOLATIONS: {
      path: '/office/violations',
      title: 'Violation Reports',
      protected: true,
      exact: true,
      icon: AlertTriangle,
    },
    SETTINGS: {
      path: '/office/settings',
      title: 'Office Settings',
      protected: true,
      exact: false,
      icon: ShieldCheck,
      GEOGRAPHIC: {
        path: '/office/settings/geographic',
        title: 'Geographic Settings',
        protected: true,
        exact: true,
      },
      STRIPE: {
        path: '/office/settings/stripe',
        title: 'Stripe Payments',
        protected: true,
        exact: true,
      },
    },
  },
} as const

// ============================================================================
// Strongly-Typed Routes Object
// ============================================================================

export const ROUTES = ROUTES_CONFIG

// ============================================================================
// Dynamic Route Builders
// ============================================================================

/**
 * Build a route with dynamic parameters
 * @example buildRoute(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: 123 }) => '/office/cms/jobs/123/edit'
 * @deprecated Use buildPath instead
 */
export function buildRoute(route: RouteConfig, params: RouteParams = {}): string {
  let path = route.path

  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, String(value))
  }

  // Validate all params were replaced
  if (path.includes(':')) {
    throw new Error(`Missing required parameters for route: ${route.path}`)
  }

  return path
}

/**
 * Build a route path with dynamic parameters
 * @example buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: 123 }) => '/office/cms/jobs/123/edit'
 */
export function buildPath(route: RouteConfig, params: RouteParams = {}): string {
  return buildRoute(route, params)
}

/**
 * Type-safe route builders for common dynamic routes
 * @deprecated These will be updated to use nested routes in a future update
 */
export const RouteBuilder = {
  // Office routes
  officeUsersEdit: (id: string | number) => buildPath(ROUTES.OFFICE.CMS.WORKERS.EDIT, { id }),
  officeJobsEdit: (id: string | number) => buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id }),
  officeUniversitiesEdit: (id: string | number) =>
    buildPath(ROUTES.OFFICE.CMS.UNIVERSITIES.EDIT, { id }),
  officeTeamsEdit: (id: string | number) => buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL.EDIT, { id }),
  officeTeamsDetail: (id: string | number) => buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL, { id }),
  officeTeamsAnalytics: (id: string | number) =>
    buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL.ANALYTICS, { id }),
  officeTeamsSettings: (id: string | number) =>
    buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL.SETTINGS, { id }),
  projectEdit: (id: string | number) => buildPath(ROUTES.OFFICE.CMS.PROJECTS.DETAIL.EDIT, { id }),
  projectDetail: (id: string | number) => buildPath(ROUTES.OFFICE.CMS.PROJECTS.DETAIL, { id }),
  officeBackgroundChecksRequest: () => ROUTES.OFFICE.ATS.CHECKS.REQUEST.path,
  officeBackgroundChecksAdmin: () => ROUTES.OFFICE.ATS.CHECKS.ADMIN.path,
  officeIdVerifications: () => ROUTES.OFFICE.ATS.ID_VERIFICATIONS.path,
  officeStorage: () => ROUTES.OFFICE.STORAGE.path,
  officePayments: () => ROUTES.OFFICE.PAYMENTS.path,
  officeTransactions: () => ROUTES.OFFICE.TRANSACTIONS.path,
  officeViolations: () => ROUTES.OFFICE.VIOLATIONS.path,
  dashboardBackgroundCheck: () => ROUTES.DASHBOARD.PROFILE.BACKGROUND_CHECK.path,
  dashboardBackgroundCheckInitiate: () => ROUTES.DASHBOARD.PROFILE.BACKGROUND_CHECK.INITIATE.path,
  dashboardBackgroundCheckDispute: (checkId: string | number) =>
    buildPath(ROUTES.DASHBOARD.PROFILE.BACKGROUND_CHECK.DISPUTE, {
      checkId,
    }),
  dashboardProfileIdVerification: () => ROUTES.DASHBOARD.PROFILE.ID_VERIFICATION.path,

  // Dashboard routes
  dashboardUser: (userId: string | number) => buildPath(ROUTES.DASHBOARD.USER, { userId }),
  discoverWorkerDetail: (id: string | number) =>
    buildPath(ROUTES.DASHBOARD.DISCOVER.WORKERS.DETAIL, { id }),
  discoverJobDetail: (id: string | number) =>
    buildPath(ROUTES.DASHBOARD.DISCOVER.JOBS.DETAIL, { id }),
  dashboardEmployer: (id: string | number) =>
    buildPath(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.DETAIL, { id }),
  dashboardOrganizationCreate: () => ROUTES.DASHBOARD.ORGANIZATIONS.CREATE.path,
  dashboardTeams: () => ROUTES.DASHBOARD.TEAMS.path,
  dashboardTeamDetail: (teamId: string | number) =>
    buildPath(ROUTES.DASHBOARD.TEAMS.DETAIL, { teamId }),
  dashboardTeamsInvitations: () => ROUTES.DASHBOARD.TEAMS.INVITATIONS.path,
  dashboardWorkLogs: () => ROUTES.DASHBOARD.WORK_LOGS.path,
  dashboardWorkLogDetail: (workLogId: string | number) =>
    buildPath(ROUTES.DASHBOARD.WORK_LOGS.DETAIL, { workLogId }),
  dashboardWorkLogCreate: () => ROUTES.DASHBOARD.WORK_LOGS.CREATE.path,
  dashboardApplicationInquiry: (applicationId: string | number) =>
    buildPath(ROUTES.DASHBOARD.APPLICATIONS.INQUIRY, { applicationId }),
} as const

// ============================================================================
// Navigation Hierarchy (Legacy - kept for backward compatibility during migration)
// ============================================================================

export type RouteHierarchyNode = {
  key: string
  children?: readonly RouteHierarchyNode[]
}

// This will be deprecated once all code is migrated to nested routes
export const ROUTE_HIERARCHY: readonly RouteHierarchyNode[] = [] as const

// ============================================================================
// Legacy Compatibility (for gradual migration)
// ============================================================================

/**
 * @deprecated Use ROUTES.AUTH.LOGIN, ROUTES.AUTH.CONFIRM, ROUTES.AUTH.SUCCESS instead
 */
export const AUTH_ROUTES = {
  INDEX: ROUTES.AUTH.LOGIN,
  CONFIRM: ROUTES.AUTH.CONFIRM,
  SUCCESS: ROUTES.AUTH.SUCCESS,
} as const

/**
 * @deprecated Use nested ROUTES.DASHBOARD structure instead
 */
export const DASHBOARD_ROUTES = {
  INDEX: ROUTES.DASHBOARD,
  PROFILE: ROUTES.DASHBOARD.PROFILE,
  PROFILE_ID_VERIFICATION: ROUTES.DASHBOARD.PROFILE.ID_VERIFICATION,
  PROFILE_BACKGROUND_CHECK: ROUTES.DASHBOARD.PROFILE.BACKGROUND_CHECK,
  PROFILE_BACKGROUND_CHECK_INITIATE: ROUTES.DASHBOARD.PROFILE.BACKGROUND_CHECK.INITIATE,
  SETTINGS: ROUTES.DASHBOARD.SETTINGS,
  NOTIFICATIONS: ROUTES.DASHBOARD.SETTINGS.NOTIFICATIONS,
  TEAMS: ROUTES.DASHBOARD.TEAMS,
  TEAM_DETAIL: ROUTES.DASHBOARD.TEAMS.DETAIL,
  INVITATIONS: ROUTES.DASHBOARD.TEAMS.INVITATIONS,
  WORK_LOGS: ROUTES.DASHBOARD.WORK_LOGS,
  WORK_LOGS_CREATE: ROUTES.DASHBOARD.WORK_LOGS.CREATE,
  WORK_LOGS_DETAIL: ROUTES.DASHBOARD.WORK_LOGS.DETAIL,
  APPLICATIONS: ROUTES.DASHBOARD.APPLICATIONS,
  APPLICATION_INQUIRY: ROUTES.DASHBOARD.APPLICATIONS.INQUIRY,
} as const

/**
 * @deprecated Use nested ROUTES.OFFICE structure instead
 */
export const OFFICE_ROUTES = {
  INDEX: ROUTES.OFFICE,
  USERS: ROUTES.OFFICE.CMS.WORKERS,
  JOBS: ROUTES.OFFICE.CMS.JOBS,
  TEAMS: ROUTES.OFFICE.CMS.TEAMS,
  TEAMS_DETAIL: ROUTES.OFFICE.CMS.TEAMS.DETAIL,
  TEAMS_ANALYTICS: ROUTES.OFFICE.CMS.TEAMS.DETAIL.ANALYTICS,
  TEAMS_SETTINGS: ROUTES.OFFICE.CMS.TEAMS.DETAIL.SETTINGS,
  PROJECTS: ROUTES.OFFICE.CMS.PROJECTS,
  PROJECTS_DETAIL: ROUTES.OFFICE.CMS.PROJECTS.DETAIL,
  PROJECTS_EDIT: ROUTES.OFFICE.CMS.PROJECTS.DETAIL.EDIT,
  UNIVERSITIES: ROUTES.OFFICE.CMS.UNIVERSITIES,
  BACKGROUND_CHECKS: ROUTES.OFFICE.ATS.CHECKS,
  ID_VERIFICATIONS: ROUTES.OFFICE.ATS.ID_VERIFICATIONS,
  BACKGROUND_CHECKS_ADMIN: ROUTES.OFFICE.ATS.CHECKS.ADMIN,
  NOTIFICATIONS: ROUTES.OFFICE.NOTIFICATIONS,
  STORAGE: ROUTES.OFFICE.STORAGE,
  PAYMENTS: ROUTES.OFFICE.PAYMENTS,
  TRANSACTIONS: ROUTES.OFFICE.TRANSACTIONS,
  VIOLATIONS: ROUTES.OFFICE.VIOLATIONS,
  SETTINGS: ROUTES.OFFICE.SETTINGS,
  SETTINGS_GEOGRAPHIC: ROUTES.OFFICE.SETTINGS.GEOGRAPHIC,
  SETTINGS_STRIPE: ROUTES.OFFICE.SETTINGS.STRIPE,
  APPLICATIONS: ROUTES.OFFICE.APPLICATIONS,
  APPLICATION_INQUIRY: ROUTES.OFFICE.APPLICATIONS.INQUIRY,
} as const

// ============================================================================
// Route Helpers
// ============================================================================

/**
 * Helper function to flatten nested routes for iteration
 * This will be replaced by the new helper functions in task 2
 */
function flattenRoutesForHelper(routeNode: RouteNode): RouteConfig[] {
  const routes: RouteConfig[] = []

  if (isRouteConfig(routeNode)) {
    routes.push(routeNode)
  } else {
    for (const value of Object.values(routeNode)) {
      routes.push(...flattenRoutesForHelper(value))
    }
  }

  return routes
}

/**
 * Check if a path is protected (requires authentication)
 */
export function isProtectedPath(path: string): boolean {
  const allRoutes = flattenRoutesForHelper(ROUTES)
  return allRoutes.some(
    (route) =>
      route.protected === true &&
      path.startsWith(route.path.split(':')[0])
  )
}

/**
 * Check if a path is an auth path
 */
export function isAuthPath(path: string): boolean {
  const allRoutes = flattenRoutesForHelper(ROUTES)
  return allRoutes.some(
    (route) => route.protected === false && path.startsWith(route.path)
  )
}

/**
 * Check if a path matches a route (handles dynamic segments)
 * Respects the exact flag on route configuration
 */
export function matchesRoute(path: string, route: RouteConfig): boolean {
  const normalizedPath = path.replace(/\/+$/, '') || '/'
  const routePattern = route.path.replace(/:[^/]+/g, '[^/]+')
  const regex = new RegExp(`^${routePattern}$`)

  // Exact match if flag is set
  if (route.exact) {
    return regex.test(normalizedPath)
  }

  // Prefix match for parent routes
  const basePath = route.path.split(':')[0]
  return normalizedPath.startsWith(basePath) || regex.test(normalizedPath)
}

/**
 * Check if current path is active (matches route or is a child)
 */
export function isActiveRoute(currentPath: string, route: RouteConfig): boolean {
  // Exact match
  if (currentPath === route.path) return true

  // Handle dynamic routes
  if (matchesRoute(currentPath, route)) return true

  // Check if current path is a child of this route
  const basePath = route.path.split(':')[0]
  return currentPath.startsWith(`${basePath}/`)
}

// ============================================================================
// Nested Route Helper Functions
// ============================================================================

/**
 * Returns all child routes at a specific tier from a route node
 * @param routeNode - The route node to traverse (e.g., ROUTES.DASHBOARD.PROFILE)
 * @returns Array of RouteConfig objects for all child routes
 * @example
 * getRoutesAtLevel(ROUTES.DASHBOARD.PROFILE) // Returns [GENERAL, EMPLOYMENT, SKILLS, ...]
 */
export function getRoutesAtLevel(routeNode: RouteNode): RouteConfig[] {
  const routes: RouteConfig[] = []

  if (isRouteConfig(routeNode)) {
    // If it's a terminal route, return it
    return [routeNode]
  }

  // Traverse all children
  for (const value of Object.values(routeNode)) {
    if (isRouteConfig(value)) {
      routes.push(value)
    } else if (typeof value === 'object' && value !== null) {
      // Recursively get routes from nested objects
      routes.push(...getRoutesAtLevel(value))
    }
  }

  return routes
}

/**
 * Options for flattenRoutes function
 */
export interface FlattenRoutesOptions {
  /** Filter out routes with hidden: true */
  hidden?: boolean
  /** Filter out routes that don't match a predicate */
  filter?: (route: RouteConfig) => boolean
}

/**
 * Converts nested route structure to flat array of terminal routes
 * @param routeNode - Optional starting node (defaults to ROUTES root)
 * @param options - Optional filter options
 * @returns Flat array of all terminal routes in the subtree
 * @example
 * flattenRoutes(ROUTES.DASHBOARD.PROFILE) // Returns all profile sub-routes
 * flattenRoutes(ROUTES, { hidden: false }) // Returns all non-hidden routes
 */
export function flattenRoutes(
  routeNode: RouteNode = ROUTES,
  options: FlattenRoutesOptions = {}
): RouteConfig[] {
  const routes: RouteConfig[] = []
  const { hidden = true, filter } = options

  if (isRouteConfig(routeNode)) {
    // Terminal route
    if (hidden || !routeNode.hidden) {
      if (!filter || filter(routeNode)) {
        routes.push(routeNode)
      }
    }
  } else {
    // Non-terminal route - traverse children
    for (const value of Object.values(routeNode)) {
      routes.push(...flattenRoutes(value, options))
    }
  }

  return routes
}

/**
 * Finds a route configuration by path in the nested structure
 * @param path - The path to search for
 * @param routeNode - Optional starting node (defaults to ROUTES root)
 * @returns The matching RouteConfig or null if not found
 */
function findRouteByPath(
  path: string,
  routeNode: RouteNode = ROUTES
): { route: RouteConfig; parent: RouteNode | null } | null {
  const normalizedPath = path.replace(/\/+$/, '') || '/'

  if (isRouteConfig(routeNode)) {
    // Check if this route matches
    if (routeNode.path === normalizedPath || matchesRoute(normalizedPath, routeNode)) {
      return { route: routeNode, parent: null }
    }
    return null
  }

  // Search in children
  for (const [, value] of Object.entries(routeNode)) {
    if (isRouteConfig(value)) {
      if (value.path === normalizedPath || matchesRoute(normalizedPath, value)) {
        return { route: value, parent: routeNode }
      }
    } else {
      const result = findRouteByPath(path, value)
      if (result) {
        // If we found it in a child, the parent is the current node
        if (result.parent === null) {
          result.parent = routeNode
        }
        return result
      }
    }
  }

  return null
}

/**
 * Returns the parent route configuration for a given route
 * @param route - Route configuration or path string
 * @returns Parent route configuration or null if top-level
 * @example
 * getParentRoute(ROUTES.DASHBOARD.PROFILE.GENERAL) // Returns ROUTES.DASHBOARD.PROFILE
 */
export function getParentRoute(
  route: RouteConfig | string
): RouteConfig | null {
  const path = typeof route === 'string' ? route : route.path
  const result = findRouteByPath(path)

  if (!result || !result.parent) {
    return null
  }

  // If parent is a RouteConfig, return it
  if (isRouteConfig(result.parent)) {
    return result.parent
  }

  // If parent is a route node, we need to find the route config
  // This happens when the parent is a non-terminal node
  // For now, return null as we can't easily get the parent config
  // This could be enhanced to track the path during traversal
  return null
}

/**
 * Generates breadcrumb trail from current path
 * @param currentPath - Current URL path
 * @returns Array of route configurations from root to current route
 * @example
 * getBreadcrumbs('/dashboard/profile/general')
 * // Returns [ROUTES.DASHBOARD, ROUTES.DASHBOARD.PROFILE, ROUTES.DASHBOARD.PROFILE.GENERAL]
 */
export function getBreadcrumbs(currentPath: string): RouteConfig[] {
  const breadcrumbs: RouteConfig[] = []
  const normalizedPath = currentPath.replace(/\/+$/, '') || '/'
  const segments = normalizedPath.split('/').filter(Boolean)

  // Build path progressively and find matching routes
  let currentRoutePath = ''
  for (let i = 0; i < segments.length; i++) {
    currentRoutePath += i === 0 ? segments[i] : `/${segments[i]}`
    const fullPath = `/${currentRoutePath}`

    // Try to find exact match first
    const allRoutes = flattenRoutes()
    let matchedRoute: RouteConfig | null = null

    // Try exact match
    matchedRoute = allRoutes.find((r) => r.path === fullPath) || null

    // Try dynamic match
    if (!matchedRoute) {
      matchedRoute = allRoutes.find((r) => matchesRoute(fullPath, r)) || null
    }

    // Try prefix match for parent routes
    if (!matchedRoute) {
      matchedRoute =
        allRoutes.find(
          (r) => !r.exact && fullPath.startsWith(r.path.split(':')[0])
        ) || null
    }

    if (matchedRoute) {
      breadcrumbs.push(matchedRoute)
    }
  }

  return breadcrumbs
}

/**
 * Filters routes by user roles, returning only accessible routes
 * @param routeNode - Route node to filter (defaults to ROUTES root)
 * @param userRoles - Array of user role strings
 * @returns Filtered nested route structure containing only accessible routes
 * @example
 * filterRoutesByRole(ROUTES.OFFICE, ['worker']) // Returns empty structure if OFFICE requires 'office' role
 */
export function filterRoutesByRole(
  routeNode: RouteNode = ROUTES,
  userRoles: string[] = []
): RouteNode | null {
  if (isRouteConfig(routeNode)) {
    // Terminal route - check if user has required roles
    if (routeNode.roles && routeNode.roles.length > 0) {
      const hasRequiredRole = routeNode.roles.some((role) => userRoles.includes(role))
      return hasRequiredRole ? routeNode : null
    }
    // No role requirement - accessible to all
    return routeNode
  }

  // Non-terminal route - filter children recursively
  const filtered: Record<string, RouteNode> = {}
  let hasAccessibleChildren = false

  for (const [key, value] of Object.entries(routeNode)) {
    const filteredChild = filterRoutesByRole(value, userRoles)
    if (filteredChild !== null) {
      filtered[key] = filteredChild
      hasAccessibleChildren = true
    }
  }

  // If this node itself is a route config (has path), include it if it has accessible children
  // or if it has no role requirements
  if (hasAccessibleChildren) {
    return filtered
  }

  // Check if the node itself is accessible
  // For non-terminal nodes, we need to check if they have a path property
  // This is a simplified version - in practice, non-terminal nodes might also have route properties
  return null
}


// ============================================================================
// Type Exports
// ============================================================================

// Export helper for type checking
export { isRouteConfig }

// Type for accessing nested routes (will be properly typed once all routes are nested)
export type RoutePath = string
export type RouteKey = string
