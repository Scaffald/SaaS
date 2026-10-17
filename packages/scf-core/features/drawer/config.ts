import { ROUTES } from '@scf/core/constants/routes'
import type { OrganizationMembership } from '@scf/core/utils/useOrganizations'
import {
  AlertTriangle,
  BarChart3,
  Bookmark,
  Briefcase,
  Building2,
  ClipboardCheck,
  CreditCard,
  Database,
  FileText,
  Link,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
} from 'lucide-react-native'
import type { AppMode } from '@scf/core/utils/useAppMode'
import type { DrawerItemConfig } from './types'
import { ownsPath } from './utils'

/**
 * Per-organization entries under Employers. On an org's own pages the tab
 * strip becomes that org's: its overview, Teams and Logs.
 */
const buildOrgSubItems = (memberships: OrganizationMembership[]): DrawerItemConfig[] => {
  const seen = new Set<string>()
  return memberships
    .filter((m) => {
      if (seen.has(m.organization_id)) return false
      seen.add(m.organization_id)
      return true
    })
    .map((m) => ({
      key: `org-${m.organization_slug}`,
      title: m.organization_name,
      href: `/employers/org/${m.organization_slug}`,
      subItems: [
        {
          key: `org-${m.organization_slug}-teams`,
          titleKey: ROUTES.EMPLOYERS.TEAMS.titleKey,
          href: `/employers/org/${m.organization_slug}/teams`,
        },
        {
          key: `org-${m.organization_slug}-logs`,
          titleKey: ROUTES.EMPLOYERS.LOGS.titleKey,
          href: `/employers/org/${m.organization_slug}/logs`,
        },
      ],
    }))
}

/**
 * Generates drawer items dynamically from dashboard routes
 * @param memberships - Optional org memberships; when present, orgs are nested under Employers
 * @returns Array of drawer item configurations
 */
export const generateDashboardDrawerItems = (
  memberships?: OrganizationMembership[]
): DrawerItemConfig[] => {
  const items: DrawerItemConfig[] = []

  // Home — the worker dashboard. Its tabs are Overview, News, Analytics;
  // Notifications is the drawer's own footer row, not a tab.
  items.push({
    key: 'dashboard',
    titleKey: 'routes.dashboard.home',
    href: ROUTES.DASHBOARD.path,
    routeKey: 'DASHBOARD',
    icon: BarChart3,
    subItems: [
      {
        key: 'dashboard-index',
        titleKey: 'routes.dashboard.analytics.overview',
        href: ROUTES.DASHBOARD.path,
        exact: true,
      },
      {
        key: 'dashboard-news',
        titleKey: ROUTES.DASHBOARD.NEWS.titleKey,
        href: ROUTES.DASHBOARD.NEWS.path,
      },
      {
        key: 'dashboard-analytics',
        titleKey: ROUTES.DASHBOARD.ANALYTICS.titleKey,
        href: ROUTES.DASHBOARD.ANALYTICS.path,
        icon: TrendingUp,
      },
    ],
  })

  // Communities
  items.push({
    key: 'communities',
    titleKey: ROUTES.COMMUNITIES.titleKey,
    href: ROUTES.COMMUNITIES.path,
    routeKey: 'COMMUNITIES',
    icon: Bookmark,
    subItems: [
      {
        key: 'communities-hub',
        titleKey: ROUTES.COMMUNITIES.titleKey,
        href: ROUTES.COMMUNITIES.path,
        exact: true,
      },
      {
        key: 'communities-connections',
        titleKey: ROUTES.COMMUNITIES.CONNECTIONS.titleKey,
        href: ROUTES.COMMUNITIES.CONNECTIONS.path,
      },
      {
        key: 'communities-bookmarks',
        titleKey: ROUTES.COMMUNITIES.BOOKMARKS.titleKey,
        href: ROUTES.COMMUNITIES.BOOKMARKS.path,
      },
      {
        key: 'communities-reputation',
        titleKey: ROUTES.COMMUNITIES.REPUTATION.titleKey,
        href: ROUTES.COMMUNITIES.REPUTATION.path,
      },
    ],
  })

  // Workers
  items.push({
    key: 'workers',
    titleKey: 'navigation.discoverWorkers',
    href: ROUTES.WORKERS.path,
    routeKey: 'WORKERS',
    icon: Users,
    subItems: [
      {
        key: 'workers-index',
        titleKey: 'navigation.workersList',
        href: ROUTES.WORKERS.path,
        exact: true,
      },
      { key: 'workers-map', titleKey: 'navigation.discoverMap', href: ROUTES.WORKERS.MAP.path },
    ],
  })

  // Employers — search, create, join, then each organisation you belong to
  const employerSubItems: DrawerItemConfig[] = [
    {
      key: 'employers-index',
      titleKey: 'navigation.employersList',
      href: ROUTES.EMPLOYERS.path,
      exact: true,
    },
    {
      key: 'employers-create',
      titleKey: 'navigation.employersCreate',
      href: ROUTES.EMPLOYERS.CREATE.path,
    },
    {
      key: 'employers-join',
      titleKey: 'navigation.employersJoin',
      href: ROUTES.EMPLOYERS.INVITATIONS.path,
    },
    ...buildOrgSubItems(memberships ?? []),
  ]

  items.push({
    key: 'employers',
    titleKey: 'navigation.discoverEmployers',
    href: ROUTES.EMPLOYERS.path,
    routeKey: 'EMPLOYERS',
    icon: Building2,
    subItems: employerSubItems,
  })

  // Jobs
  const jobSubItems: DrawerItemConfig[] = [
    {
      key: 'jobs-index',
      titleKey: ROUTES.JOBS.BROWSE.titleKey,
      href: ROUTES.JOBS.BROWSE.path,
      exact: true,
    },
    { key: 'jobs-saved', titleKey: 'navigation.jobsSaved', href: ROUTES.JOBS.SAVED.path },
    {
      key: 'jobs-applications',
      titleKey: ROUTES.JOBS.APPLICATIONS.titleKey,
      href: ROUTES.JOBS.APPLICATIONS.path,
    },
  ]
  // My Listings is the employer's Jobs, in employer mode's own nav (#1157).
  // It was gated on org membership, so a member using the app as a worker
  // saw it in their job-seeker tabs.

  // The row lands on the signed-in listing, not the public one, which has no
  // drawer (#766) — but it owns everything under /jobs.
  items.push({
    key: 'jobs',
    titleKey: 'navigation.discoverJobs',
    href: ROUTES.JOBS.BROWSE.path,
    matchPrefix: ROUTES.JOBS.path,
    routeKey: 'JOBS',
    icon: Briefcase,
    subItems: jobSubItems,
  })

  // Assessments
  items.push({
    key: 'assessments',
    titleKey: ROUTES.ASSESSMENTS.titleKey,
    href: ROUTES.ASSESSMENTS.path,
    routeKey: 'ASSESSMENTS',
    icon: ClipboardCheck,
    subItems: [
      {
        key: 'assessments-index',
        titleKey: ROUTES.ASSESSMENTS.OVERVIEW.titleKey,
        href: ROUTES.ASSESSMENTS.OVERVIEW.path,
      },
      {
        key: 'assessments-pulse',
        titleKey: ROUTES.ASSESSMENTS.LUSCHER.titleKey,
        href: ROUTES.ASSESSMENTS.LUSCHER.path,
      },
      {
        key: 'assessments-ipip',
        titleKey: ROUTES.ASSESSMENTS.IPIP.titleKey,
        href: ROUTES.ASSESSMENTS.IPIP.path,
      },
      {
        key: 'assessments-riasec',
        titleKey: ROUTES.ASSESSMENTS.RIASEC.titleKey,
        href: ROUTES.ASSESSMENTS.RIASEC.path,
      },
      {
        key: 'assessments-occupation',
        titleKey: ROUTES.ASSESSMENTS.OCCUPATION.titleKey,
        href: ROUTES.ASSESSMENTS.OCCUPATION.path,
      },
      {
        key: 'assessments-career-explorer',
        titleKey: ROUTES.ASSESSMENTS.CAREER_EXPLORER.titleKey,
        href: ROUTES.ASSESSMENTS.CAREER_EXPLORER.path,
      },
    ],
  })

  // Profile
  items.push({
    key: 'profile',
    titleKey: ROUTES.PROFILE.titleKey,
    href: ROUTES.PROFILE.path,
    routeKey: 'PROFILE',
    icon: User,
    subItems: [
      {
        key: 'profile-overview',
        titleKey: ROUTES.PROFILE.OVERVIEW.titleKey,
        href: ROUTES.PROFILE.OVERVIEW.path,
        exact: true,
      },
      {
        key: 'profile-resume',
        titleKey: ROUTES.PROFILE.RESUME.titleKey,
        href: ROUTES.PROFILE.RESUME.path,
      },
      {
        key: 'profile-skills',
        titleKey: ROUTES.PROFILE.SKILLS.titleKey,
        href: ROUTES.PROFILE.SKILLS.path,
      },
      {
        key: 'profile-experience',
        titleKey: ROUTES.PROFILE.EXPERIENCE.titleKey,
        href: ROUTES.PROFILE.EXPERIENCE.path,
      },
      {
        key: 'profile-verification',
        titleKey: ROUTES.PROFILE.ID_VERIFICATION.titleKey,
        href: ROUTES.PROFILE.ID_VERIFICATION.path,
        // The background check is a panel of the Verification page, and its
        // own pages (initiate, dispute) sit under /profile/background-check.
        alsoOwns: [ROUTES.PROFILE.BACKGROUND_CHECK.path],
      },
    ],
  })

  // Settings: not in main nav; use drawer footer link to /dashboard/settings

  return items
}

/**
 * Where Screening lands, on desktop and phone alike (#1203 — the two used to
 * disagree, so one section had two front doors). For the background-check
 * admin that is the review queue. Everyone else is turned away there ("Admin
 * access required"), so they land on their organisation's own checks instead
 * (#1297).
 */
export const screeningLanding = (isCheckAdmin: boolean): string =>
  isCheckAdmin ? ROUTES.OFFICE.ATS.CHECKS.ADMIN.path : ROUTES.OFFICE.ATS.CHECKS.path

/**
 * The Office section. Its sub-items are the Office tab strip.
 */
export const generateOfficeDrawerItem = (isCheckAdmin = false): DrawerItemConfig => ({
  key: 'office',
  title: 'Office',
  href: ROUTES.OFFICE.path,
  icon: Building2,
  subItems: [
    // The prototype's admin sections open on Overview then Screening. /office
    // had no tab of its own, so the strip lit nothing on the Office home and
    // offered no way back to it.
    {
      key: 'office-overview',
      title: 'Overview',
      href: ROUTES.OFFICE.path,
      exact: true,
      icon: BarChart3,
    },
    // Nothing owned /office/ats/*, so every screening page lit no tab (#1203).
    // Community verification is a screening queue too — its screen says so —
    // though it lives under /office/communities.
    {
      key: 'office-screening',
      title: 'Screening',
      href: screeningLanding(isCheckAdmin),
      matchPrefix: ROUTES.OFFICE.ATS.path,
      alsoOwns: [ROUTES.OFFICE.COMMUNITIES.VERIFICATION.path],
      icon: ShieldCheck,
    },
    {
      key: 'office-cms',
      titleKey: 'routes.office.cms.title',
      href: ROUTES.OFFICE.CMS.path,
      icon: Users,
    },
    {
      key: 'office-applications',
      titleKey: 'routes.office.applications.title',
      href: ROUTES.OFFICE.APPLICATIONS.path,
      icon: Briefcase,
    },
    {
      key: 'office-compliance',
      titleKey: 'routes.office.compliance.title',
      href: ROUTES.OFFICE.COMPLIANCE.EEO_REPORTS.path,
      matchPrefix: ROUTES.OFFICE.COMPLIANCE.path,
      icon: ShieldCheck,
    },
    {
      key: 'office-integrations',
      titleKey: 'routes.office.integrations.title',
      href: ROUTES.OFFICE.INTEGRATIONS.BACKGROUND_CHECKS.path,
      matchPrefix: ROUTES.OFFICE.INTEGRATIONS.path,
      icon: Database,
    },
    {
      key: 'office-payments',
      titleKey: 'routes.office.payments',
      href: ROUTES.OFFICE.PAYMENTS.path,
      icon: CreditCard,
    },
    {
      key: 'office-transactions',
      titleKey: 'routes.office.transactions',
      href: ROUTES.OFFICE.TRANSACTIONS.path,
      icon: FileText,
    },
    {
      key: 'office-violations',
      titleKey: 'routes.office.violations',
      href: ROUTES.OFFICE.VIOLATIONS.path,
      icon: AlertTriangle,
    },
  ],
})

/**
 * Drawer items for the top-level /communities section (Hub, Connections, Bookmarks, Reputation)
 */
export const getCommunitiesDrawerItems = (): DrawerItemConfig[] => [
  {
    key: 'communities-hub',
    titleKey: ROUTES.COMMUNITIES.titleKey,
    href: ROUTES.COMMUNITIES.path,
    routeKey: 'COMMUNITIES',
    icon: Bookmark,
    exact: true,
  },
  {
    key: 'communities-connections',
    titleKey: ROUTES.COMMUNITIES.CONNECTIONS.titleKey,
    href: ROUTES.COMMUNITIES.CONNECTIONS.path,
    routeKey: 'COMMUNITIES_CONNECTIONS',
    icon: Link,
  },
  {
    key: 'communities-bookmarks',
    titleKey: ROUTES.COMMUNITIES.BOOKMARKS.titleKey,
    href: ROUTES.COMMUNITIES.BOOKMARKS.path,
    routeKey: 'COMMUNITIES_BOOKMARKS',
    icon: Bookmark,
  },
  {
    key: 'communities-reputation',
    titleKey: ROUTES.COMMUNITIES.REPUTATION.titleKey,
    href: ROUTES.COMMUNITIES.REPUTATION.path,
    routeKey: 'COMMUNITIES_REPUTATION',
    icon: Bookmark,
  },
]

/**
 * Get drawer items for the drawer menu
 * @param memberships - Optional org memberships; orgs are nested under the Employers group
 */
export const getDrawerItems = (memberships?: OrganizationMembership[]): DrawerItemConfig[] => {
  return generateDashboardDrawerItems(memberships)
}

const byKey = (items: DrawerItemConfig[]) => new Map(items.map((item) => [item.key, item]))

/**
 * The worker's sections, in the prototype's order: Home, Profile,
 * Assessments, Jobs, then the employer directory (read-only — no create,
 * join or own-organisation tabs) and Communities. Find talent is the
 * employer's; it is not a worker section.
 */
const workerNav = (memberships: OrganizationMembership[] | undefined): DrawerItemConfig[] => {
  const all = byKey(generateDashboardDrawerItems(memberships))
  const employers = all.get('employers')
  return [
    all.get('dashboard'),
    all.get('profile'),
    all.get('assessments'),
    all.get('jobs'),
    employers && { ...employers, subItems: undefined },
    all.get('communities'),
  ].filter((item): item is DrawerItemConfig => Boolean(item))
}

/**
 * The employer's sections: Find talent, their own postings, their
 * applicant pipeline, and their organisations. The pipeline lives at
 * /office/applications, but in employer mode it is the employer's own
 * section — not Office, whose tabs are the admin's (Content Management,
 * Payment Analytics…). The prototype's Recruiting, Stages & rules and Your
 * stats are not built yet (#843, #844, the employer stats issue), so they
 * are absent rather than rows that lead nowhere. Home stays until #1117
 * decides what an employer's Home is.
 */
const employerNav = (memberships: OrganizationMembership[] | undefined): DrawerItemConfig[] => {
  const all = byKey(generateDashboardDrawerItems(memberships))
  return [
    all.get('dashboard'),
    all.get('workers'),
    {
      key: 'employer-jobs',
      titleKey: 'navigation.jobsMyListings',
      href: ROUTES.JOBS.MY_LISTINGS.path,
      icon: Briefcase,
    },
    {
      key: 'employer-applications',
      titleKey: 'routes.office.applications.title',
      href: ROUTES.OFFICE.APPLICATIONS.path,
      icon: ClipboardCheck,
    },
    all.get('employers'),
  ].filter((item): item is DrawerItemConfig => Boolean(item))
}

/**
 * The whole navigation tree for one person in one mode: Office first when
 * they hold the role, then the sections of the mode they are using. The
 * drawer draws the top level; the section tab strip draws the level
 * beneath. Desktop used to show one list in every mode while the phone bar
 * switched with it, so the two disagreed (#1157).
 */
export const getNavItems = (
  memberships: OrganizationMembership[] | undefined,
  hasOfficeRole: boolean,
  mode: AppMode = 'worker',
  isCheckAdmin = false
): DrawerItemConfig[] => [
  ...(hasOfficeRole ? [generateOfficeDrawerItem(isCheckAdmin)] : []),
  ...(mode === 'employer' ? employerNav(memberships) : workerNav(memberships)),
]

/**
 * How specifically a top-level item claims `pathname`: the length of the
 * prefix it owns it by, or -1 when it does not. Two items can own one page —
 * Office owns everything under /office, and the employer's Applications owns
 * /office/applications — and the more specific one is the page's section.
 */
const topLevelClaim = (item: DrawerItemConfig, pathname: string): number =>
  ownsPath(item, pathname) ? (item.matchPrefix ?? item.href).length : -1

/** The one top-level item that owns `pathname`, or null. */
export const activeNavKey = (items: DrawerItemConfig[], pathname: string): string | null => {
  let best: DrawerItemConfig | null = null
  let bestLength = -1
  for (const item of items) {
    const length = topLevelClaim(item, pathname)
    if (length > bestLength) {
      best = item
      bestLength = length
    }
  }
  return best?.key ?? null
}

// ============================================================================
// Mobile Bottom Nav Configuration
// ============================================================================

import { Home } from 'lucide-react-native'
import type { ComponentType } from 'react'

export type MobileTabItem = {
  key: string
  label: string
  icon: ComponentType<{ size: number; color: string }>
  route: string
  exact?: boolean
}

export type MobileSection = {
  key: string
  label: string
  icon: ComponentType<{ size: number; color: string }>
  route: string
  /** Route prefixes that indicate the user is "inside" this section */
  matchPrefixes: string[]
  subItems: MobileTabItem[]
}

/**
 * Mobile primary tabs for the WORKER: Home / Jobs / Apps / Profile, with
 * More (the drawer) after them — the prototype's worker bar. It used to be
 * Home / Jobs / Community, which left a worker's two most-visited places —
 * their applications and their record — behind More, and lit no tab on
 * /profile or /assessments (#1158). Communities moved into More.
 *
 * Jobs claims its pages one by one rather than all of /jobs, so the
 * applications page belongs to Apps alone.
 *
 * Employer mode gets its own set, below.
 */
export const MOBILE_SECTIONS: MobileSection[] = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    route: ROUTES.DASHBOARD.path,
    // Only the dashboard is "Home". Sections without their own tab used to be
    // listed here, which left Home lit up while the user was somewhere else
    // entirely — including employer screens in employer mode (#385).
    matchPrefixes: ['/dashboard'],
    subItems: [],
  },
  {
    key: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    route: ROUTES.JOBS.BROWSE.path,
    matchPrefixes: [ROUTES.JOBS.BROWSE.path, ROUTES.JOBS.SAVED.path, '/jobs/view'],
    subItems: [],
  },
  {
    key: 'applications',
    label: 'Apps',
    icon: ClipboardCheck,
    route: ROUTES.JOBS.APPLICATIONS.path,
    matchPrefixes: [ROUTES.JOBS.APPLICATIONS.path],
    subItems: [],
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: User,
    route: ROUTES.PROFILE.path,
    // Assessments are proof on the record, so they light the record's tab.
    matchPrefixes: [ROUTES.PROFILE.path, ROUTES.ASSESSMENTS.path],
    subItems: [],
  },
]

/**
 * Employer-mode tabs.
 *
 * The bar used to hide itself entirely in employer mode, on the reasoning that
 * "employer navigation lives in the drawer until a dedicated employer tab set
 * is designed" (#385). The prototype designs it: the phone bar mirrors the role
 * you are currently in, rather than showing worker tabs to an employer — or,
 * as we did, showing nothing at all. Hiding it left an employer on a phone with
 * no primary navigation whatsoever; every move went through the drawer behind
 * the header avatar.
 *
 * The prototype's employer bar is Talent / Apps / Jobs / Recruiting / More.
 * Recruiting is deliberately absent here: that surface does not exist yet, and
 * a tab navigating nowhere is worse than one fewer tab. Screening takes the
 * fourth slot instead — for those who can open it (#1297). Every Screening
 * page sits under /office, which turns away anyone without the office role,
 * so they get no Screening tab at all; office staff land on the review queue
 * when they hold the background-check admin role and on their organisation's
 * checks when they do not, as on desktop.
 *
 * Everything else — profile, settings, notifications, organizations — stays in
 * the drawer, exactly as it does for workers.
 */
export type ScreeningAccess = {
  /** Holds the `office` role, which every /office page requires. */
  hasOfficeRole: boolean
  /** Holds `background_check_admin`, which the review queue requires. */
  isCheckAdmin: boolean
}

export const getEmployerMobileSections = ({
  hasOfficeRole,
  isCheckAdmin,
}: ScreeningAccess): MobileSection[] => [
  {
    key: 'talent',
    label: 'Talent',
    icon: Users,
    route: ROUTES.WORKERS.path,
    matchPrefixes: ['/workers'],
    subItems: [],
  },
  {
    key: 'applications',
    label: 'Apps',
    icon: ClipboardCheck,
    route: ROUTES.OFFICE.APPLICATIONS.path,
    matchPrefixes: ['/office/applications'],
    subItems: [],
  },
  {
    // The employer's Jobs screen is `/jobs/my-listings`; `/office/cms/jobs`
    // is the admin CMS and stays admin-only (#835). This tab pointed at the
    // CMS, so an employer tapping Jobs on a phone landed in a table of every
    // organisation's postings rather than their own.
    key: 'employer-jobs',
    label: 'Jobs',
    icon: Briefcase,
    route: ROUTES.JOBS.MY_LISTINGS.path,
    matchPrefixes: ['/jobs/my-listings', '/office/cms/jobs'],
    subItems: [],
  },
  ...(hasOfficeRole
    ? [
        {
          key: 'screening',
          label: 'Screening',
          icon: ShieldCheck,
          // The same landing as the desktop Office tab (#1203, #1297).
          route: screeningLanding(isCheckAdmin),
          // The whole ATS cluster lights this tab, not just its landing — an
          // admin on /office/ats/checks is still "in Screening" — and so does
          // community verification, which the desktop Screening tab also owns.
          matchPrefixes: [ROUTES.OFFICE.ATS.path, ROUTES.OFFICE.COMMUNITIES.VERIFICATION.path],
          subItems: [],
        },
      ]
    : []),
]
