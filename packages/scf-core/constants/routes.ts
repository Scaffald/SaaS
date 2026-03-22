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
 * - Automated enforcement via `pnpm lint:routes`
 */

import {
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ClipboardCheck,
  CreditCard,
  Database,
  FileText,
  Fingerprint,
  GraduationCap,
  HardDrive,
  ShieldCheck,
  Users,
} from 'lucide-react-native'
import type { TranslationKey } from '@scf/core/locales'
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
  readonly titleKey: TranslationKey
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
    titleKey: 'routes.home',
    protected: false,
    exact: true,
  },

  AUTH: {
    LOGIN: {
      path: '/auth',
      titleKey: 'routes.auth.login',
      protected: false,
      exact: true,
    },
    CONFIRM: {
      path: '/auth/confirm',
      titleKey: 'routes.auth.confirm',
      protected: false,
      exact: true,
    },
    SUCCESS: {
      path: '/auth/success',
      titleKey: 'routes.auth.success',
      protected: false,
      exact: true,
    },
    VERIFY: {
      path: '/auth/verify',
      titleKey: 'routes.auth.verify',
      protected: false,
      exact: true,
    },
    TERMS: {
      path: '/auth/terms',
      titleKey: 'routes.auth.terms',
      protected: false,
      exact: true,
    },
    PRIVACY: {
      path: '/auth/privacy',
      titleKey: 'routes.auth.privacy',
      protected: false,
      exact: true,
    },
    CALLBACK: {
      path: '/auth/callback',
      titleKey: 'routes.auth.callback',
      protected: false,
      exact: true,
    },
  },

  ONBOARDING: {
    path: '/onboarding',
    titleKey: 'routes.onboarding.title',
    protected: true,
    exact: true,
  },

  /** Public profile by slug - /u/:slug (no auth) */
  PUBLIC_PROFILE: {
    path: '/users/:slug',
    titleKey: 'routes.publicProfile',
    protected: false,
    exact: true,
  },

  WORKERS: {
    path: '/workers',
    titleKey: 'routes.dashboard.discover.workers.title',
    protected: true,
    exact: false,
    DETAIL: {
      path: '/workers/:id',
      titleKey: 'routes.dashboard.discover.workers.detail',
      protected: true,
      exact: true,
    },
    MAP: {
      path: '/workers/map',
      titleKey: 'routes.dashboard.discover.map',
      protected: true,
      exact: true,
    },
  },

  EMPLOYERS: {
    path: '/employers',
    titleKey: 'routes.dashboard.discover.employers.title',
    protected: true,
    exact: false,
    CREATE: {
      path: '/employers/create',
      titleKey: 'routes.dashboard.discover.employers.create',
      protected: true,
      exact: true,
    },
    DETAIL: {
      path: '/employers/:id',
      titleKey: 'routes.dashboard.discover.employers.detail',
      protected: true,
      exact: true,
    },
    INVITATIONS: {
      path: '/employers/invitations',
      titleKey: 'routes.org.invitations',
      protected: true,
      exact: true,
    },
    ORG: {
      path: '/employers/org',
      titleKey: 'routes.org.title',
      protected: true,
      exact: false,
      DETAIL: {
        path: '/employers/org/:slug',
        titleKey: 'routes.org.detail',
        protected: true,
        exact: false,
        TEAMS: {
          path: '/employers/org/:slug/teams',
          titleKey: 'routes.dashboard.teams.title',
          protected: true,
          exact: false,
          DETAIL: {
            path: '/employers/org/:slug/teams/:teamId',
            titleKey: 'routes.dashboard.teams.detail',
            protected: true,
            exact: true,
          },
        },
        LOGS: {
          path: '/employers/org/:slug/logs',
          titleKey: 'routes.org.logs',
          protected: true,
          exact: false,
          CREATE: {
            path: '/employers/org/:slug/logs/create',
            titleKey: 'routes.dashboard.workLogs.create',
            protected: true,
            exact: true,
          },
          DETAIL: {
            path: '/employers/org/:slug/logs/:workLogId',
            titleKey: 'routes.dashboard.workLogs.detail',
            protected: true,
            exact: true,
          },
        },
      },
    },
    TEAMS: {
      path: '/employers/teams',
      titleKey: 'routes.dashboard.teams.title',
      protected: true,
      exact: false,
      INVITATIONS: {
        path: '/employers/teams/invitations',
        titleKey: 'routes.dashboard.teams.invitations',
        protected: true,
        exact: true,
      },
      DETAIL: {
        path: '/employers/teams/:teamId',
        titleKey: 'routes.dashboard.teams.detail',
        protected: true,
        exact: true,
      },
    },
    LOGS: {
      path: '/employers/logs',
      titleKey: 'routes.dashboard.workLogs.title',
      protected: true,
      exact: false,
      CREATE: {
        path: '/employers/logs/create',
        titleKey: 'routes.dashboard.workLogs.create',
        protected: true,
        exact: true,
      },
      DETAIL: {
        path: '/employers/logs/:workLogId',
        titleKey: 'routes.dashboard.workLogs.detail',
        protected: true,
        exact: true,
      },
    },
    ORGANIZATIONS: {
      path: '/employers/organizations',
      titleKey: 'routes.org.title',
      protected: true,
      exact: false,
      CREATE: {
        path: '/employers/organizations/create',
        titleKey: 'routes.org.title',
        protected: true,
        exact: true,
      },
    },
  },

  PROFILE: {
    path: '/profile',
    titleKey: 'routes.dashboard.profile.title',
    protected: true,
    exact: false,
    OVERVIEW: { path: '/profile', titleKey: 'routes.dashboard.profile.overview', protected: true, exact: true },
    GENERAL: { path: '/profile/general', titleKey: 'routes.dashboard.profile.general', protected: true, exact: true },
    EMPLOYMENT: { path: '/profile/employment', titleKey: 'routes.dashboard.profile.employment', protected: true, exact: true },
    SKILLS: { path: '/profile/skills', titleKey: 'routes.dashboard.profile.skills', protected: true, exact: true },
    CERTIFICATIONS: { path: '/profile/certifications', titleKey: 'routes.dashboard.profile.certifications', protected: true, exact: true },
    IMPORT_REVIEW: { path: '/profile/import-review', titleKey: 'routes.dashboard.profile.importReview', protected: true, exact: true },
    EDUCATION: { path: '/profile/education', titleKey: 'routes.dashboard.profile.education', protected: true, exact: true },
    EXPERIENCE: { path: '/profile/experience', titleKey: 'routes.dashboard.profile.experience', protected: true, exact: true },
    ID_VERIFICATION: { path: '/profile/verification', titleKey: 'routes.dashboard.profile.verification', protected: true, exact: true },
    RESUME: {
      path: '/profile/resume', titleKey: 'routes.dashboard.profile.resume.title', protected: true, exact: false,
      REVIEW: { path: '/profile/resume/review', titleKey: 'routes.dashboard.profile.resume.review', protected: true, exact: true },
    },
    BACKGROUND_CHECK: {
      path: '/profile/background-check', titleKey: 'routes.dashboard.profile.backgroundCheck.title', protected: true, exact: false,
      INITIATE: { path: '/profile/background-check/initiate', titleKey: 'routes.dashboard.profile.backgroundCheck.initiate', protected: true, exact: true },
      DISPUTE: { path: '/profile/background-check/:checkId/dispute', titleKey: 'routes.dashboard.profile.backgroundCheck.dispute', protected: true, exact: true },
    },
  },

  ASSESSMENTS: {
    path: '/assessments',
    titleKey: 'routes.dashboard.assessments.title',
    protected: true,
    exact: false,
    ANALYTICS: {
      path: '/assessments',
      titleKey: 'routes.dashboard.assessments.analytics',
      protected: true,
      exact: true,
    },
    LUSCHER: {
      path: '/assessments/pulse',
      titleKey: 'routes.dashboard.assessments.luscher',
      protected: true,
      exact: true,
    },
    IPIP: {
      path: '/assessments/ipip',
      titleKey: 'routes.dashboard.assessments.ipip.title',
      protected: true,
      exact: true,
      RESULTS: {
        path: '/assessments/ipip/results',
        titleKey: 'routes.dashboard.assessments.ipip.results',
        protected: true,
        exact: true,
      },
      SHARED: {
        path: '/assessments/ipip/shared/:token',
        titleKey: 'routes.dashboard.assessments.ipip.shared',
        protected: true,
        exact: true,
      },
    },
    RIASEC: {
      path: '/assessments/riasec',
      titleKey: 'routes.dashboard.assessments.riasec',
      protected: true,
      exact: true,
    },
    OCCUPATION: {
      path: '/assessments/occupation',
      titleKey: 'routes.dashboard.assessments.occupation',
      protected: true,
      exact: true,
    },
    CAREER_EXPLORER: {
      path: '/assessments/career-explorer',
      titleKey: 'routes.dashboard.careerExplorer.title',
      protected: true,
      exact: false,
      DETAIL: {
        path: '/assessments/career-explorer/:onetCode',
        titleKey: 'routes.dashboard.careerExplorer.detail',
        protected: true,
        exact: true,
      },
    },
  },

  JOBS: {
    path: '/jobs',
    titleKey: 'routes.dashboard.discover.jobs.title',
    protected: true,
    exact: false,
    DETAIL: {
      path: '/jobs/:id',
      titleKey: 'routes.dashboard.discover.jobs.detail',
      protected: true,
      exact: true,
    },
    APPLICATIONS: {
      path: '/jobs/applications',
      titleKey: 'routes.dashboard.applications.title',
      protected: true,
      exact: false,
      INQUIRY: {
        path: '/jobs/applications/:applicationId/inquiry',
        titleKey: 'routes.dashboard.applications.inquiry',
        protected: true,
        exact: true,
      },
    },
    MY_LISTINGS: {
      path: '/jobs/my-listings',
      titleKey: 'routes.dashboard.discover.jobs.myListings',
      protected: true,
      exact: true,
    },
  },

  /** @deprecated Use EMPLOYERS.ORG instead — kept for backward compatibility */
  ORG: {
    path: '/employers/org',
    titleKey: 'routes.org.title',
    protected: true,
    exact: false,
    INVITATIONS: {
      path: '/employers/invitations',
      titleKey: 'routes.org.invitations',
      protected: true,
      exact: true,
    },
    DETAIL: {
      path: '/employers/org/:slug',
      titleKey: 'routes.org.detail',
      protected: true,
      exact: false,
      TEAMS: {
        path: '/employers/org/:slug/teams',
        titleKey: 'routes.dashboard.teams.title',
        protected: true,
        exact: false,
        DETAIL: {
          path: '/employers/org/:slug/teams/:teamId',
          titleKey: 'routes.dashboard.teams.detail',
          protected: true,
          exact: true,
        },
      },
      LOGS: {
        path: '/employers/org/:slug/logs',
        titleKey: 'routes.org.logs',
        protected: true,
        exact: false,
        CREATE: {
          path: '/employers/org/:slug/logs/create',
          titleKey: 'routes.dashboard.workLogs.create',
          protected: true,
          exact: true,
        },
        DETAIL: {
          path: '/employers/org/:slug/logs/:workLogId',
          titleKey: 'routes.dashboard.workLogs.detail',
          protected: true,
          exact: true,
        },
      },
    },
  },

  DASHBOARD: {
    path: '/dashboard',
    titleKey: 'routes.dashboard.title',
    protected: true,
    exact: false,
    PROFILE: {
      path: '/profile',
      titleKey: 'routes.dashboard.profile.title',
      protected: true,
      exact: false,
      OVERVIEW: {
        path: '/profile',
        titleKey: 'routes.dashboard.profile.overview',
        protected: true,
        exact: true,
      },
      GENERAL: {
        path: '/profile/general',
        titleKey: 'routes.dashboard.profile.general',
        protected: true,
        exact: true,
      },
      EMPLOYMENT: {
        path: '/profile/employment',
        titleKey: 'routes.dashboard.profile.employment',
        protected: true,
        exact: true,
      },
      SKILLS: {
        path: '/profile/skills',
        titleKey: 'routes.dashboard.profile.skills',
        protected: true,
        exact: true,
      },
      CERTIFICATIONS: {
        path: '/profile/certifications',
        titleKey: 'routes.dashboard.profile.certifications',
        protected: true,
        exact: true,
      },
      IMPORT_REVIEW: {
        path: '/profile/import-review',
        titleKey: 'routes.dashboard.profile.importReview',
        protected: true,
        exact: true,
      },
      EDUCATION: {
        path: '/profile/education',
        titleKey: 'routes.dashboard.profile.education',
        protected: true,
        exact: true,
      },
      EXPERIENCE: {
        path: '/profile/experience',
        titleKey: 'routes.dashboard.profile.experience',
        protected: true,
        exact: true,
      },
      ID_VERIFICATION: {
        path: '/profile/verification',
        titleKey: 'routes.dashboard.profile.verification',
        protected: true,
        exact: true,
      },
      RESUME: {
        path: '/profile/resume',
        titleKey: 'routes.dashboard.profile.resume.title',
        protected: true,
        exact: false,
        REVIEW: {
          path: '/profile/resume/review',
          titleKey: 'routes.dashboard.profile.resume.review',
          protected: true,
          exact: true,
        },
      },
      BACKGROUND_CHECK: {
        path: '/profile/background-check',
        titleKey: 'routes.dashboard.profile.backgroundCheck.title',
        protected: true,
        exact: false,
        INITIATE: {
          path: '/profile/background-check/initiate',
          titleKey: 'routes.dashboard.profile.backgroundCheck.initiate',
          protected: true,
          exact: true,
        },
        DISPUTE: {
          path: '/profile/background-check/:checkId/dispute',
          titleKey: 'routes.dashboard.profile.backgroundCheck.dispute',
          protected: true,
          exact: true,
        },
      },
    },
    SETTINGS: {
      path: '/dashboard/settings',
      titleKey: 'routes.dashboard.settings.title',
      protected: true,
      exact: false,
      GENERAL: {
        path: '/dashboard/settings/general',
        titleKey: 'routes.dashboard.settings.general',
        protected: true,
        exact: true,
      },
      SECURITY: {
        path: '/dashboard/settings/security',
        titleKey: 'routes.dashboard.settings.security',
        protected: true,
        exact: true,
      },
      AUTHENTICATION: {
        path: '/dashboard/settings/authentication',
        titleKey: 'routes.dashboard.settings.authentication',
        protected: true,
        exact: true,
      },
      NOTIFICATIONS: {
        path: '/dashboard/settings/notifications',
        titleKey: 'routes.dashboard.settings.notifications',
        protected: true,
        exact: true,
      },
      PRIVACY: {
        path: '/dashboard/settings/privacy',
        titleKey: 'routes.dashboard.settings.privacy',
        protected: true,
        exact: true,
      },
      AUTHORIZED_APPS: {
        path: '/dashboard/settings/authorized-apps',
        titleKey: 'routes.dashboard.settings.authorizedApps',
        protected: true,
        exact: true,
      },
    },
    DISCOVER: {
      /** @deprecated Use ROUTES.WORKERS.MAP instead */
      MAP: {
        path: '/workers/map',
        titleKey: 'routes.dashboard.discover.map',
        protected: true,
        exact: true,
      },
      /** @deprecated Use ROUTES.WORKERS instead */
      WORKERS: {
        path: '/workers',
        titleKey: 'routes.dashboard.discover.workers.title',
        protected: true,
        exact: false,
        DETAIL: {
          path: '/workers/:id',
          titleKey: 'routes.dashboard.discover.workers.detail',
          protected: true,
          exact: true,
        },
      },
      EMPLOYERS: {
        path: '/employers',
        titleKey: 'routes.dashboard.discover.employers.title',
        protected: true,
        exact: false,
        CREATE: {
          path: '/employers/create',
          titleKey: 'routes.dashboard.discover.employers.create',
          protected: true,
          exact: true,
        },
        DETAIL: {
          path: '/employers/:id',
          titleKey: 'routes.dashboard.discover.employers.detail',
          protected: true,
          exact: true,
        },
        INVITATIONS: {
          path: '/employers/invitations',
          titleKey: 'routes.org.invitations',
          protected: true,
          exact: true,
        },
        ORG: {
          path: '/employers/org',
          titleKey: 'routes.org.title',
          protected: true,
          exact: false,
          DETAIL: {
            path: '/employers/org/:slug',
            titleKey: 'routes.org.detail',
            protected: true,
            exact: false,
            TEAMS: {
              path: '/employers/org/:slug/teams',
              titleKey: 'routes.dashboard.teams.title',
              protected: true,
              exact: false,
              DETAIL: {
                path: '/employers/org/:slug/teams/:teamId',
                titleKey: 'routes.dashboard.teams.detail',
                protected: true,
                exact: true,
              },
            },
            LOGS: {
              path: '/employers/org/:slug/logs',
              titleKey: 'routes.org.logs',
              protected: true,
              exact: false,
              CREATE: {
                path: '/employers/org/:slug/logs/create',
                titleKey: 'routes.dashboard.workLogs.create',
                protected: true,
                exact: true,
              },
              DETAIL: {
                path: '/employers/org/:slug/logs/:workLogId',
                titleKey: 'routes.dashboard.workLogs.detail',
                protected: true,
                exact: true,
              },
            },
          },
        },
      },
      JOBS: {
        path: '/jobs',
        titleKey: 'routes.dashboard.discover.jobs.title',
        protected: true,
        exact: false,
        DETAIL: {
          path: '/jobs/:id',
          titleKey: 'routes.dashboard.discover.jobs.detail',
          protected: true,
          exact: true,
        },
        APPLICATIONS: {
          path: '/jobs/applications',
          titleKey: 'routes.dashboard.applications.title',
          protected: true,
          exact: false,
          INQUIRY: {
            path: '/jobs/applications/:applicationId/inquiry',
            titleKey: 'routes.dashboard.applications.inquiry',
            protected: true,
            exact: true,
          },
        },
        MY_LISTINGS: {
          path: '/jobs/my-listings',
          titleKey: 'routes.dashboard.discover.jobs.myListings',
          protected: true,
          exact: true,
        },
      },
    },
    TEAMS: {
      path: '/employers/teams',
      titleKey: 'routes.dashboard.teams.title',
      protected: true,
      exact: false,
      INVITATIONS: {
        path: '/employers/teams/invitations',
        titleKey: 'routes.dashboard.teams.invitations',
        protected: true,
        exact: true,
      },
      DETAIL: {
        path: '/employers/teams/:teamId',
        titleKey: 'routes.dashboard.teams.detail',
        protected: true,
        exact: true,
      },
    },
    WORK_LOGS: {
      path: '/employers/logs',
      titleKey: 'routes.dashboard.workLogs.title',
      protected: true,
      exact: false,
      CREATE: {
        path: '/employers/logs/create',
        titleKey: 'routes.dashboard.workLogs.create',
        protected: true,
        exact: true,
      },
      DETAIL: {
        path: '/employers/logs/:workLogId',
        titleKey: 'routes.dashboard.workLogs.detail',
        protected: true,
        exact: true,
      },
    },
    USER: {
      path: '/dashboard/users/:userId',
      titleKey: 'routes.dashboard.user',
      protected: true,
      exact: true,
    },
    ASSESSMENTS: {
      path: '/assessments',
      titleKey: 'routes.dashboard.assessments.title',
      protected: true,
      exact: false,
      ANALYTICS: {
        path: '/assessments',
        titleKey: 'routes.dashboard.assessments.analytics',
        protected: true,
        exact: true,
      },
      LUSCHER: {
        path: '/assessments/pulse',
        titleKey: 'routes.dashboard.assessments.luscher',
        protected: true,
        exact: true,
      },
      IPIP: {
        path: '/assessments/ipip',
        titleKey: 'routes.dashboard.assessments.ipip.title',
        protected: true,
        exact: true,
        RESULTS: {
          path: '/assessments/ipip/results',
          titleKey: 'routes.dashboard.assessments.ipip.results',
          protected: true,
          exact: true,
        },
        SHARED: {
          path: '/assessments/ipip/shared/:token',
          titleKey: 'routes.dashboard.assessments.ipip.shared',
          protected: true,
          exact: true,
        },
      },
      RIASEC: {
        path: '/assessments/riasec',
        titleKey: 'routes.dashboard.assessments.riasec',
        protected: true,
        exact: true,
      },
      OCCUPATION: {
        path: '/assessments/occupation',
        titleKey: 'routes.dashboard.assessments.occupation',
        protected: true,
        exact: true,
      },
    },
    CAREER_EXPLORER: {
      path: '/assessments/career-explorer',
      titleKey: 'routes.dashboard.careerExplorer.title',
      protected: true,
      exact: false,
      DETAIL: {
        path: '/assessments/career-explorer/:onetCode',
        titleKey: 'routes.dashboard.careerExplorer.detail',
        protected: true,
        exact: true,
      },
    },
    NEWS: {
      path: '/dashboard/news',
      titleKey: 'routes.dashboard.news',
      protected: true,
      exact: true,
    },
    ANALYTICS: {
      path: '/dashboard/analytics',
      titleKey: 'routes.dashboard.analytics.title' as const,
      protected: true,
      exact: false,
      OVERVIEW: {
        path: '/dashboard/analytics',
        titleKey: 'routes.dashboard.analytics.overview' as const,
        protected: true,
        exact: true,
      },
      ENGAGEMENT: {
        path: '/dashboard/analytics/engagement',
        titleKey: 'routes.dashboard.analytics.engagement' as const,
        protected: true,
        exact: true,
      },
      VISIBILITY: {
        path: '/dashboard/analytics/visibility',
        titleKey: 'routes.dashboard.analytics.visibility' as const,
        protected: true,
        exact: true,
      },
      SEARCH: {
        path: '/dashboard/analytics/search',
        titleKey: 'routes.dashboard.analytics.search' as const,
        protected: true,
        exact: true,
      },
    },
  },

  COMMUNITIES: {
    path: '/communities',
    titleKey: 'routes.communities.title',
    protected: true,
    exact: false,
    CONNECTIONS: {
      path: '/communities/connections',
      titleKey: 'routes.communities.connections.title',
      protected: true,
      exact: true,
    },
    BOOKMARKS: {
      path: '/communities/bookmarks',
      titleKey: 'routes.communities.bookmarks',
      protected: true,
      exact: true,
    },
    REPUTATION: {
      path: '/communities/reputation',
      titleKey: 'routes.communities.reputation',
      protected: true,
      exact: true,
    },
    DETAIL: {
      path: '/communities/:slug',
      titleKey: 'routes.communities.detail',
      protected: true,
      exact: false,
      MEMBERS: {
        path: '/communities/:slug/members',
        titleKey: 'routes.communities.members',
        protected: true,
        exact: true,
      },
      POST: {
        CREATE: {
          path: '/communities/:slug/post/create',
          titleKey: 'routes.communities.post.create',
          protected: true,
          exact: true,
        },
        DETAIL: {
          path: '/communities/:slug/post/:postId',
          titleKey: 'routes.communities.post.detail',
          protected: true,
          exact: true,
        },
      },
    },
  },

  OFFICE: {
    path: '/office',
    titleKey: 'routes.office.title',
    protected: true,
    exact: false,
    CMS: {
      path: '/office/cms',
      titleKey: 'routes.office.cms.title',
      protected: true,
      exact: false,
      WORKERS: {
        path: '/office/cms/workers',
        titleKey: 'routes.office.cms.workers.title',
        protected: true,
        exact: false,
        icon: Users,
        CREATE: {
          path: '/office/cms/workers/create',
          titleKey: 'routes.office.cms.workers.create',
          protected: true,
          exact: true,
        },
        EDIT: {
          path: '/office/cms/workers/:id/edit',
          titleKey: 'routes.office.cms.workers.edit',
          protected: true,
          exact: true,
        },
      },
      JOBS: {
        path: '/office/cms/jobs',
        titleKey: 'routes.office.cms.jobs.title',
        protected: true,
        exact: false,
        icon: Briefcase,
        CREATE: {
          path: '/office/cms/jobs/create',
          titleKey: 'routes.office.cms.jobs.create',
          protected: true,
          exact: true,
        },
        EDIT: {
          path: '/office/cms/jobs/:id/edit',
          titleKey: 'routes.office.cms.jobs.edit',
          protected: true,
          exact: true,
        },
      },
      ORGANIZATIONS: {
        path: '/office/cms/organizations',
        titleKey: 'routes.office.cms.organizations.title',
        protected: true,
        exact: false,
        icon: Building2,
        CREATE: {
          path: '/office/cms/organizations/create',
          titleKey: 'routes.office.cms.organizations.create',
          protected: true,
          exact: true,
        },
        EDIT: {
          path: '/office/cms/organizations/:id/edit',
          titleKey: 'routes.office.cms.organizations.edit',
          protected: true,
          exact: true,
        },
      },
      TEAMS: {
        path: '/office/cms/teams',
        titleKey: 'routes.office.cms.teams.title',
        protected: true,
        exact: false,
        icon: Users,
        CREATE: {
          path: '/office/cms/teams/create',
          titleKey: 'routes.office.cms.teams.create',
          protected: true,
          exact: true,
        },
        DETAIL: {
          path: '/office/cms/teams/:id',
          titleKey: 'routes.office.cms.teams.detail.title',
          protected: true,
          exact: false,
          EDIT: {
            path: '/office/cms/teams/:id/edit',
            titleKey: 'routes.office.cms.teams.detail.edit',
            protected: true,
            exact: true,
          },
          ANALYTICS: {
            path: '/office/cms/teams/:id/analytics',
            titleKey: 'routes.office.cms.teams.detail.analytics',
            protected: true,
            exact: true,
          },
          SETTINGS: {
            path: '/office/cms/teams/:id/settings',
            titleKey: 'routes.office.cms.teams.detail.settings',
            protected: true,
            exact: true,
          },
        },
      },
      PROJECTS: {
        path: '/office/cms/projects',
        titleKey: 'routes.office.cms.projects.title',
        protected: true,
        exact: false,
        icon: ClipboardCheck,
        CREATE: {
          path: '/office/cms/projects/create',
          titleKey: 'routes.office.cms.projects.create',
          protected: true,
          exact: true,
        },
        DETAIL: {
          path: '/office/cms/projects/:id',
          titleKey: 'routes.office.cms.projects.detail.title',
          protected: true,
          exact: false,
          EDIT: {
            path: '/office/cms/projects/:id/edit',
            titleKey: 'routes.office.cms.projects.detail.edit',
            protected: true,
            exact: true,
          },
        },
      },
      UNIVERSITIES: {
        path: '/office/cms/universities',
        titleKey: 'routes.office.cms.universities.title',
        protected: true,
        exact: false,
        icon: GraduationCap,
        CREATE: {
          path: '/office/cms/universities/create',
          titleKey: 'routes.office.cms.universities.create',
          protected: true,
          exact: true,
        },
        EDIT: {
          path: '/office/cms/universities/:id/edit',
          titleKey: 'routes.office.cms.universities.edit',
          protected: true,
          exact: true,
        },
      },
    },
    ATS: {
      path: '/office/ats',
      titleKey: 'routes.office.ats.title',
      protected: true,
      exact: false,
      icon: ClipboardCheck,
      DETAIL: {
        path: '/office/ats/:id',
        titleKey: 'routes.office.ats.detail',
        protected: true,
        exact: true,
      },
      CHECKS: {
        path: '/office/ats/checks',
        titleKey: 'routes.office.ats.checks.title',
        protected: true,
        exact: false,
        icon: ShieldCheck,
        REQUEST: {
          path: '/office/ats/request',
          titleKey: 'routes.office.ats.checks.request',
          protected: true,
          exact: true,
        },
        ADMIN: {
          path: '/office/ats/admin',
          titleKey: 'routes.office.ats.checks.admin',
          protected: true,
          exact: true,
        },
      },
      ID_VERIFICATIONS: {
        path: '/office/ats/id-verifications',
        titleKey: 'routes.office.ats.idVerifications',
        protected: true,
        exact: true,
        icon: Fingerprint,
      },
      SCHEDULING: {
        path: '/office/ats/scheduling',
        titleKey: 'routes.office.ats.scheduling',
        protected: true,
        exact: true,
        icon: Calendar,
      },
      SELF_SCHEDULE: {
        path: '/office/ats/self-schedule',
        titleKey: 'routes.office.ats.selfSchedule',
        protected: true,
        exact: true,
      },
      METRICS: {
        path: '/office/ats/metrics',
        titleKey: 'routes.office.ats.metrics',
        protected: true,
        exact: true,
      },
    },
    COMMUNITIES: {
      path: '/office/communities',
      titleKey: 'routes.office.communities.title',
      protected: true,
      exact: false,
      VERIFICATION: {
        path: '/office/communities/verification',
        titleKey: 'routes.office.communities.verification',
        protected: true,
        exact: true,
      },
    },
    APPLICATIONS: {
      path: '/office/applications',
      titleKey: 'routes.office.applications.title',
      protected: true,
      exact: false,
      icon: ClipboardCheck,
      INQUIRY: {
        path: '/office/applications/:applicationId/inquiry',
        titleKey: 'routes.office.applications.inquiry',
        protected: true,
        exact: true,
      },
    },
    COMPLIANCE: {
      path: '/office/compliance',
      titleKey: 'routes.office.compliance.title',
      protected: true,
      exact: false,
      icon: ShieldCheck,
      EEO_REPORTS: {
        path: '/office/compliance/eeo-reports',
        titleKey: 'routes.office.compliance.eeoReports',
        protected: true,
        exact: true,
      },
      PROJECT_HIRING: {
        path: '/office/compliance/project-hiring',
        titleKey: 'routes.office.compliance.projectHiring',
        protected: true,
        exact: true,
      },
    },
    INTEGRATIONS: {
      path: '/office/integrations',
      titleKey: 'routes.office.integrations.title',
      protected: true,
      exact: false,
      icon: Database,
      HRIS: {
        path: '/office/integrations/hris',
        titleKey: 'routes.office.integrations.hris',
        protected: true,
        exact: true,
      },
      BACKGROUND_CHECKS: {
        path: '/office/integrations/background-checks',
        titleKey: 'routes.office.integrations.backgroundChecks',
        protected: true,
        exact: true,
      },
    },
    NOTIFICATIONS: {
      path: '/office/notifications',
      titleKey: 'routes.office.notifications',
      protected: true,
      exact: true,
      icon: Bell,
      hidden: true,
    },
    STORAGE: {
      path: '/office/storage',
      titleKey: 'routes.office.storage',
      protected: true,
      exact: true,
      icon: HardDrive,
      hidden: true,
    },
    PAYMENTS: {
      path: '/office/payments',
      titleKey: 'routes.office.payments',
      protected: true,
      exact: true,
      icon: CreditCard,
    },
    TRANSACTIONS: {
      path: '/office/transactions',
      titleKey: 'routes.office.transactions',
      protected: true,
      exact: true,
      icon: FileText,
    },
    VIOLATIONS: {
      path: '/office/violations',
      titleKey: 'routes.office.violations',
      protected: true,
      exact: true,
      icon: AlertTriangle,
    },
    API_KEYS: {
      path: '/office/api-keys',
      titleKey: 'routes.office.apiKeys.title',
      protected: true,
      exact: true,
    },
    WEBHOOKS: {
      path: '/office/webhooks',
      titleKey: 'routes.office.webhooks.title',
      protected: true,
      exact: false,
      CREATE: {
        path: '/office/webhooks/create',
        titleKey: 'routes.office.webhooks.create',
        protected: true,
        exact: true,
      },
      DETAIL: {
        path: '/office/webhooks/:id',
        titleKey: 'routes.office.webhooks.detail',
        protected: true,
        exact: true,
      },
    },
    OAUTH_APPS: {
      path: '/office/oauth-apps',
      titleKey: 'routes.office.oauthApps.title',
      protected: true,
      exact: false,
      DETAIL: {
        path: '/office/oauth-apps/:id',
        titleKey: 'routes.office.oauthApps.detail',
        protected: true,
        exact: true,
      },
    },
    SETTINGS: {
      path: '/office/settings',
      titleKey: 'routes.office.settings.title',
      protected: true,
      exact: false,
      icon: ShieldCheck,
      hidden: true,
      GEOGRAPHIC: {
        path: '/office/settings/geographic',
        titleKey: 'routes.office.settings.geographic',
        protected: true,
        exact: true,
      },
      STRIPE: {
        path: '/office/settings/stripe',
        titleKey: 'routes.office.settings.stripe',
        protected: true,
        exact: true,
      },
    },
  },
  TEAMS: {
    INVITATIONS: {
      ACCEPT: {
        path: '/teams/invitations/accept',
        titleKey: 'routes.teams.invitations.accept',
        protected: false,
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
 * Build a route path with dynamic parameters
 * @example buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: 123 }) => '/office/cms/jobs/123/edit'
 */
export function buildPath(route: RouteConfig, params: RouteParams = {}): string {
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
    (route) => route.protected === true && path.startsWith(route.path.split(':')[0])
  )
}

/**
 * Check if a path is an auth path
 */
export function isAuthPath(path: string): boolean {
  const allRoutes = flattenRoutesForHelper(ROUTES)
  return allRoutes.some((route) => route.protected === false && path.startsWith(route.path))
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
 * @param routeNode - The route node to traverse (e.g., ROUTES.PROFILE)
 * @returns Array of RouteConfig objects for all child routes
 * @example
 * getRoutesAtLevel(ROUTES.PROFILE) // Returns [GENERAL, EMPLOYMENT, SKILLS, ...]
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
 * flattenRoutes(ROUTES.PROFILE) // Returns all profile sub-routes
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
 * getParentRoute(ROUTES.PROFILE.GENERAL) // Returns ROUTES.PROFILE
 */
export function getParentRoute(route: RouteConfig | string): RouteConfig | null {
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
 * // Returns [ROUTES.DASHBOARD, ROUTES.PROFILE, ROUTES.PROFILE.GENERAL]
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
        allRoutes.find((r) => !r.exact && fullPath.startsWith(r.path.split(':')[0])) || null
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

// ============================================================================
// Legacy Route Exports (for backward compatibility)
// ============================================================================

export const AUTH_ROUTES = ROUTES.AUTH

// ============================================================================
// Route Builder (convenience methods for building routes with parameters)
// ============================================================================

export const RouteBuilder = {
  dashboardTeams: () => ROUTES.EMPLOYERS.TEAMS.path,
  dashboardTeamsInvitations: () => ROUTES.EMPLOYERS.TEAMS.INVITATIONS.path,
  dashboardTeamDetail: (teamId: string | number) =>
    buildPath(ROUTES.EMPLOYERS.TEAMS.DETAIL, { teamId: String(teamId) }),
  officeTeamsDetail: (id: string | number) =>
    buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL, { id: String(id) }),
  officeTeamsEdit: (id: string | number) =>
    buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL.EDIT, { id: String(id) }),
  officeTeamsAnalytics: (id: string | number) =>
    buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL.ANALYTICS, { id: String(id) }),
  officeTeamsSettings: (id: string | number) =>
    buildPath(ROUTES.OFFICE.CMS.TEAMS.DETAIL.SETTINGS, { id: String(id) }),
  projectEdit: (id: string | number) =>
    buildPath(ROUTES.OFFICE.CMS.PROJECTS.DETAIL.EDIT, { id: String(id) }),
  communitiesHub: () => ROUTES.COMMUNITIES.path,
  communitiesConnections: () => ROUTES.COMMUNITIES.CONNECTIONS.path,
  communityDetail: (slug: string) =>
    buildPath(ROUTES.COMMUNITIES.DETAIL, { slug }),
  communityMembers: (slug: string) =>
    buildPath(ROUTES.COMMUNITIES.DETAIL.MEMBERS, { slug }),
  communityPostCreate: (slug: string) =>
    buildPath(ROUTES.COMMUNITIES.DETAIL.POST.CREATE, { slug }),
  communityPostDetail: (slug: string, postId: string) =>
    buildPath(ROUTES.COMMUNITIES.DETAIL.POST.DETAIL, { slug, postId }),
  communitiesBookmarks: () => ROUTES.COMMUNITIES.BOOKMARKS.path,
  communitiesReputation: () => ROUTES.COMMUNITIES.REPUTATION.path,
  /** Public profile URL path for a given slug */
  publicProfile: (slug: string) => `/users/${slug}`,
  /** My Organizations */
  orgIndex: () => ROUTES.EMPLOYERS.ORG.path,
  orgInvitations: () => ROUTES.EMPLOYERS.INVITATIONS.path,
  orgDetail: (slug: string) => buildPath(ROUTES.EMPLOYERS.ORG.DETAIL, { slug }),
  orgTeams: (slug: string) => buildPath(ROUTES.EMPLOYERS.ORG.DETAIL.TEAMS, { slug }),
  orgTeamDetail: (slug: string, teamId: string | number) =>
    buildPath(ROUTES.EMPLOYERS.ORG.DETAIL.TEAMS.DETAIL, { slug, teamId: String(teamId) }),
  orgLogs: (slug: string) => buildPath(ROUTES.EMPLOYERS.ORG.DETAIL.LOGS, { slug }),
  orgLogsCreate: (slug: string) => buildPath(ROUTES.EMPLOYERS.ORG.DETAIL.LOGS.CREATE, { slug }),
  orgLogDetail: (slug: string, workLogId: string) =>
    buildPath(ROUTES.EMPLOYERS.ORG.DETAIL.LOGS.DETAIL, { slug, workLogId }),
} as const
