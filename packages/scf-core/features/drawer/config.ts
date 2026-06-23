import { ROUTES } from '@scf/core/constants/routes'
import type { OrganizationMembership } from '@scf/core/utils/useOrganizations'
import {
  AlertTriangle,
  BarChart3,
  Bell as BellIcon,
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
import type { DrawerItemConfig } from './types'

/**
 * Build per-organization sub-items for the Employers drawer group.
 * Each org expands to show Teams and Logs.
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
      isExpandable: true,
      expandOnActive: true,
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

  // Dashboard - expandable with News subnav
  items.push({
    key: 'dashboard',
    titleKey: 'navigation.dashboard',
    href: ROUTES.DASHBOARD.path,
    routeKey: 'DASHBOARD',
    icon: BarChart3,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'dashboard-index', titleKey: 'routes.dashboard.home', href: ROUTES.DASHBOARD.path, exact: true },
      { key: 'dashboard-news', titleKey: ROUTES.DASHBOARD.NEWS.titleKey, href: ROUTES.DASHBOARD.NEWS.path },
      { key: 'dashboard-analytics', titleKey: ROUTES.DASHBOARD.ANALYTICS.titleKey, href: ROUTES.DASHBOARD.ANALYTICS.path, icon: TrendingUp },
      { key: 'dashboard-notifications', title: 'Notifications', href: ROUTES.DASHBOARD.NOTIFICATIONS.path, icon: BellIcon },
    ],
  })

  // Communities - expandable (top-level /communities section)
  items.push({
    key: 'communities',
    titleKey: ROUTES.COMMUNITIES.titleKey,
    href: ROUTES.COMMUNITIES.path,
    routeKey: 'COMMUNITIES',
    icon: Bookmark,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'communities-hub', titleKey: ROUTES.COMMUNITIES.titleKey, href: ROUTES.COMMUNITIES.path, exact: true },
      { key: 'communities-connections', titleKey: ROUTES.COMMUNITIES.CONNECTIONS.titleKey, href: ROUTES.COMMUNITIES.CONNECTIONS.path },
      { key: 'communities-bookmarks', titleKey: ROUTES.COMMUNITIES.BOOKMARKS.titleKey, href: ROUTES.COMMUNITIES.BOOKMARKS.path },
      { key: 'communities-reputation', titleKey: ROUTES.COMMUNITIES.REPUTATION.titleKey, href: ROUTES.COMMUNITIES.REPUTATION.path },
    ],
  })

  // Workers - expandable with Search and Map
  items.push({
    key: 'workers',
    titleKey: 'navigation.discoverWorkers',
    href: ROUTES.WORKERS.path,
    routeKey: 'WORKERS',
    icon: Users,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'workers-index', titleKey: 'navigation.workersList', href: ROUTES.WORKERS.path, exact: true },
      { key: 'workers-map', titleKey: 'navigation.discoverMap', href: ROUTES.WORKERS.MAP.path },
    ],
  })

  // Employers - expandable with Search, Create, Join, and per-org sub-items
  const employerSubItems: DrawerItemConfig[] = [
    { key: 'employers-index', titleKey: 'navigation.employersList', href: ROUTES.EMPLOYERS.path, exact: true },
    { key: 'employers-create', titleKey: 'navigation.employersCreate', href: ROUTES.EMPLOYERS.CREATE.path },
    { key: 'employers-join', titleKey: 'navigation.employersJoin', href: ROUTES.EMPLOYERS.INVITATIONS.path },
    ...buildOrgSubItems(memberships ?? []),
  ]

  items.push({
    key: 'employers',
    titleKey: 'navigation.discoverEmployers',
    href: ROUTES.EMPLOYERS.path,
    routeKey: 'EMPLOYERS',
    icon: Building2,
    isExpandable: true,
    expandOnActive: true,
    subItems: employerSubItems,
  })

  // Jobs - expandable with applications and optional My Listings
  const jobSubItems: DrawerItemConfig[] = [
    { key: 'jobs-index', titleKey: ROUTES.JOBS.titleKey, href: ROUTES.JOBS.path, exact: true },
    { key: 'jobs-saved', titleKey: 'navigation.jobsSaved', href: ROUTES.JOBS.SAVED.path },
    { key: 'jobs-applications', titleKey: ROUTES.JOBS.APPLICATIONS.titleKey, href: ROUTES.JOBS.APPLICATIONS.path },
  ]
  if (memberships && memberships.length > 0) {
    jobSubItems.push({
      key: 'jobs-my-listings',
      titleKey: 'navigation.jobsMyListings',
      href: ROUTES.JOBS.MY_LISTINGS.path,
    })
  }

  items.push({
    key: 'jobs',
    titleKey: 'navigation.discoverJobs',
    href: ROUTES.JOBS.path,
    routeKey: 'JOBS',
    icon: Briefcase,
    isExpandable: true,
    expandOnActive: true,
    subItems: jobSubItems,
  })

  // Assessments - expandable with second-tier (pulse, ipip, riasec, occupation)
  items.push({
    key: 'assessments',
    titleKey: ROUTES.ASSESSMENTS.titleKey,
    href: ROUTES.ASSESSMENTS.path,
    routeKey: 'ASSESSMENTS',
    icon: ClipboardCheck,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'assessments-index', titleKey: ROUTES.ASSESSMENTS.ANALYTICS.titleKey, href: ROUTES.ASSESSMENTS.ANALYTICS.path },
      { key: 'assessments-pulse', titleKey: ROUTES.ASSESSMENTS.LUSCHER.titleKey, href: ROUTES.ASSESSMENTS.LUSCHER.path },
      { key: 'assessments-ipip', titleKey: ROUTES.ASSESSMENTS.IPIP.titleKey, href: ROUTES.ASSESSMENTS.IPIP.path },
      { key: 'assessments-riasec', titleKey: ROUTES.ASSESSMENTS.RIASEC.titleKey, href: ROUTES.ASSESSMENTS.RIASEC.path },
      { key: 'assessments-occupation', titleKey: ROUTES.ASSESSMENTS.OCCUPATION.titleKey, href: ROUTES.ASSESSMENTS.OCCUPATION.path },
      { key: 'assessments-career-explorer', titleKey: ROUTES.ASSESSMENTS.CAREER_EXPLORER.titleKey, href: ROUTES.ASSESSMENTS.CAREER_EXPLORER.path },
    ],
  })

  // Profile - expandable with Overview + all tier-1 (tabs)
  items.push({
    key: 'profile',
    titleKey: ROUTES.PROFILE.titleKey,
    href: ROUTES.PROFILE.path,
    routeKey: 'PROFILE',
    icon: User,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'profile-overview', titleKey: ROUTES.PROFILE.OVERVIEW.titleKey, href: ROUTES.PROFILE.OVERVIEW.path, exact: true },
      { key: 'profile-resume', titleKey: ROUTES.PROFILE.RESUME.titleKey, href: ROUTES.PROFILE.RESUME.path },
      { key: 'profile-skills', titleKey: ROUTES.PROFILE.SKILLS.titleKey, href: ROUTES.PROFILE.SKILLS.path },
      { key: 'profile-experience', titleKey: ROUTES.PROFILE.EXPERIENCE.titleKey, href: ROUTES.PROFILE.EXPERIENCE.path },
      { key: 'profile-verification', titleKey: ROUTES.PROFILE.ID_VERIFICATION.titleKey, href: ROUTES.PROFILE.ID_VERIFICATION.path },
    ],
  })

  // Settings: not in main nav; use drawer footer link to /dashboard/settings

  return items
}

/**
 * Generates the Office drawer item with expandable sub-navigation.
 * Sub-items auto-expand when the user is within the /office route group.
 */
export const generateOfficeDrawerItem = (): DrawerItemConfig => ({
  key: 'office',
  title: 'Office',
  href: ROUTES.OFFICE.path,
  icon: Building2,
  isExpandable: true,
  expandOnActive: true,
  subItems: [
    { key: 'office-cms', titleKey: 'routes.office.cms.title', href: ROUTES.OFFICE.CMS.path, icon: Users },
    { key: 'office-ats', titleKey: 'routes.office.ats.title', href: ROUTES.OFFICE.ATS.path, icon: ClipboardCheck },
    { key: 'office-applications', titleKey: 'routes.office.applications.title', href: ROUTES.OFFICE.APPLICATIONS.path, icon: Briefcase },
    { key: 'office-compliance', titleKey: 'routes.office.compliance.title', href: ROUTES.OFFICE.COMPLIANCE.EEO_REPORTS.path, icon: ShieldCheck },
    { key: 'office-integrations', titleKey: 'routes.office.integrations.title', href: ROUTES.OFFICE.INTEGRATIONS.BACKGROUND_CHECKS.path, icon: Database },
    { key: 'office-payments', titleKey: 'routes.office.payments', href: ROUTES.OFFICE.PAYMENTS.path, icon: CreditCard },
    { key: 'office-transactions', titleKey: 'routes.office.transactions', href: ROUTES.OFFICE.TRANSACTIONS.path, icon: FileText },
    { key: 'office-violations', titleKey: 'routes.office.violations', href: ROUTES.OFFICE.VIOLATIONS.path, icon: AlertTriangle },
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
 * Mobile primary tabs — 3-tab pill (Home / Jobs / Community).
 *
 * Profile, settings, notifications, organizations and assessments are
 * accessed via the drawer (avatar tap). Discover/Workers/Assessments
 * surface as Home-tab widgets in a follow-up.
 */
export const MOBILE_SECTIONS: MobileSection[] = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    route: ROUTES.DASHBOARD.path,
    matchPrefixes: [
      '/dashboard',
      // Sections that no longer have their own tab still highlight Home
      // when the user lands on them via a Home-tab widget link.
      '/workers',
      '/employers',
      '/assessments',
      '/profile',
    ],
    subItems: [],
  },
  {
    key: 'jobs',
    label: 'Jobs',
    icon: Briefcase,
    route: ROUTES.JOBS.path,
    matchPrefixes: ['/jobs'],
    subItems: [],
  },
  {
    key: 'community',
    label: 'Community',
    icon: Bookmark,
    route: ROUTES.COMMUNITIES.path,
    matchPrefixes: ['/communities'],
    subItems: [],
  },
]
