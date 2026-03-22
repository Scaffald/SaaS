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
      href: `/dashboard/employers/org/${m.organization_slug}`,
      isExpandable: true,
      expandOnActive: true,
      subItems: [
        {
          key: `org-${m.organization_slug}-teams`,
          titleKey: ROUTES.DASHBOARD.TEAMS.titleKey,
          href: `/dashboard/employers/org/${m.organization_slug}/teams`,
        },
        {
          key: `org-${m.organization_slug}-logs`,
          titleKey: ROUTES.ORG.DETAIL.LOGS.titleKey,
          href: `/dashboard/employers/org/${m.organization_slug}/logs`,
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
    href: ROUTES.DASHBOARD.DISCOVER.WORKERS.path,
    routeKey: 'DASHBOARD_DISCOVER_WORKERS',
    icon: Users,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'workers-index', titleKey: 'navigation.workersList', href: ROUTES.DASHBOARD.DISCOVER.WORKERS.path, exact: true },
      { key: 'workers-map', titleKey: 'navigation.discoverMap', href: ROUTES.DASHBOARD.DISCOVER.MAP.path },
    ],
  })

  // Employers - expandable with Search, Create, Join, and per-org sub-items
  const employerSubItems: DrawerItemConfig[] = [
    { key: 'employers-index', titleKey: 'navigation.employersList', href: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path, exact: true },
    { key: 'employers-create', titleKey: 'navigation.employersCreate', href: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.CREATE.path },
    { key: 'employers-join', titleKey: 'navigation.employersJoin', href: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.INVITATIONS.path },
    ...buildOrgSubItems(memberships ?? []),
  ]

  items.push({
    key: 'employers',
    titleKey: 'navigation.discoverEmployers',
    href: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path,
    routeKey: 'DASHBOARD_DISCOVER_EMPLOYERS',
    icon: Building2,
    isExpandable: true,
    expandOnActive: true,
    subItems: employerSubItems,
  })

  // Jobs - expandable with applications and optional My Listings
  const jobSubItems: DrawerItemConfig[] = [
    { key: 'jobs-index', titleKey: ROUTES.DASHBOARD.DISCOVER.JOBS.titleKey, href: ROUTES.DASHBOARD.DISCOVER.JOBS.path, exact: true },
    { key: 'jobs-applications', titleKey: ROUTES.DASHBOARD.DISCOVER.JOBS.APPLICATIONS.titleKey, href: ROUTES.DASHBOARD.DISCOVER.JOBS.APPLICATIONS.path },
  ]
  if (memberships && memberships.length > 0) {
    jobSubItems.push({
      key: 'jobs-my-listings',
      titleKey: 'navigation.jobsMyListings',
      href: ROUTES.DASHBOARD.DISCOVER.JOBS.MY_LISTINGS.path,
    })
  }

  items.push({
    key: 'jobs',
    titleKey: 'navigation.discoverJobs',
    href: ROUTES.DASHBOARD.DISCOVER.JOBS.path,
    routeKey: 'DASHBOARD_DISCOVER_JOBS',
    icon: Briefcase,
    isExpandable: true,
    expandOnActive: true,
    subItems: jobSubItems,
  })

  // Assessments - expandable with second-tier (pulse, ipip, riasec, occupation)
  items.push({
    key: 'assessments',
    titleKey: ROUTES.DASHBOARD.ASSESSMENTS.titleKey,
    href: ROUTES.DASHBOARD.ASSESSMENTS.path,
    routeKey: 'DASHBOARD_ASSESSMENTS',
    icon: ClipboardCheck,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'assessments-index', titleKey: ROUTES.DASHBOARD.ASSESSMENTS.ANALYTICS.titleKey, href: ROUTES.DASHBOARD.ASSESSMENTS.ANALYTICS.path },
      { key: 'assessments-pulse', titleKey: ROUTES.DASHBOARD.ASSESSMENTS.LUSCHER.titleKey, href: ROUTES.DASHBOARD.ASSESSMENTS.LUSCHER.path },
      { key: 'assessments-ipip', titleKey: ROUTES.DASHBOARD.ASSESSMENTS.IPIP.titleKey, href: ROUTES.DASHBOARD.ASSESSMENTS.IPIP.path },
      { key: 'assessments-riasec', titleKey: ROUTES.DASHBOARD.ASSESSMENTS.RIASEC.titleKey, href: ROUTES.DASHBOARD.ASSESSMENTS.RIASEC.path },
      { key: 'assessments-occupation', titleKey: ROUTES.DASHBOARD.ASSESSMENTS.OCCUPATION.titleKey, href: ROUTES.DASHBOARD.ASSESSMENTS.OCCUPATION.path },
      { key: 'assessments-career-explorer', titleKey: ROUTES.DASHBOARD.CAREER_EXPLORER.titleKey, href: ROUTES.DASHBOARD.CAREER_EXPLORER.path },
    ],
  })

  // Profile - expandable with Overview + all tier-1 (tabs)
  items.push({
    key: 'profile',
    titleKey: ROUTES.DASHBOARD.PROFILE.titleKey,
    href: ROUTES.DASHBOARD.PROFILE.path,
    routeKey: 'DASHBOARD_PROFILE',
    icon: User,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'profile-overview', titleKey: ROUTES.DASHBOARD.PROFILE.OVERVIEW.titleKey, href: ROUTES.DASHBOARD.PROFILE.OVERVIEW.path, exact: true },
      { key: 'profile-resume', titleKey: ROUTES.DASHBOARD.PROFILE.RESUME.titleKey, href: ROUTES.DASHBOARD.PROFILE.RESUME.path },
      { key: 'profile-skills', titleKey: ROUTES.DASHBOARD.PROFILE.SKILLS.titleKey, href: ROUTES.DASHBOARD.PROFILE.SKILLS.path },
      { key: 'profile-experience', titleKey: ROUTES.DASHBOARD.PROFILE.EXPERIENCE.titleKey, href: ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path },
      { key: 'profile-verification', titleKey: ROUTES.DASHBOARD.PROFILE.ID_VERIFICATION.titleKey, href: ROUTES.DASHBOARD.PROFILE.ID_VERIFICATION.path },
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

import {
  Bell,
  Compass,
  FileText as ResumeIcon,
  Home,
  Newspaper,
  Settings,
  Star,
  Wrench,
} from 'lucide-react-native'
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

export const MOBILE_SECTIONS: MobileSection[] = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    route: ROUTES.DASHBOARD.path,
    matchPrefixes: ['/dashboard/news', '/dashboard/settings', '/dashboard/analytics'],
    subItems: [
      { key: 'home-feed', label: 'Feed', icon: Home, route: ROUTES.DASHBOARD.path, exact: true },
      { key: 'home-news', label: 'News', icon: Newspaper, route: ROUTES.DASHBOARD.NEWS.path },
      { key: 'home-analytics', label: 'Analytics', icon: TrendingUp, route: ROUTES.DASHBOARD.ANALYTICS.path },
      { key: 'home-settings', label: 'Settings', icon: Settings, route: ROUTES.DASHBOARD.SETTINGS.path },
      { key: 'home-notifs', label: 'Notifs', icon: Bell, route: ROUTES.DASHBOARD.SETTINGS.NOTIFICATIONS.path },
    ],
  },
  {
    key: 'discover',
    label: 'Discover',
    icon: Compass,
    route: ROUTES.DASHBOARD.DISCOVER.WORKERS.path,
    matchPrefixes: ['/dashboard/workers', '/dashboard/employers', '/dashboard/jobs', '/dashboard/map'],
    subItems: [
      { key: 'discover-workers', label: 'Workers', icon: Users, route: ROUTES.DASHBOARD.DISCOVER.WORKERS.path },
      { key: 'discover-employers', label: 'Employers', icon: Building2, route: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path },
      { key: 'discover-jobs', label: 'Jobs', icon: Briefcase, route: ROUTES.DASHBOARD.DISCOVER.JOBS.path },
      { key: 'discover-apps', label: 'Apps', icon: ClipboardCheck, route: ROUTES.DASHBOARD.DISCOVER.JOBS.APPLICATIONS.path },
    ],
  },
  {
    key: 'community',
    label: 'Community',
    icon: Bookmark,
    route: ROUTES.COMMUNITIES.path,
    matchPrefixes: ['/communities'],
    subItems: [
      { key: 'community-hub', label: 'Hub', icon: Bookmark, route: ROUTES.COMMUNITIES.path, exact: true },
      { key: 'community-connect', label: 'Connect', icon: Link, route: ROUTES.COMMUNITIES.CONNECTIONS.path },
      { key: 'community-bookmarks', label: 'Bookmarks', icon: Bookmark, route: ROUTES.COMMUNITIES.BOOKMARKS.path },
      { key: 'community-rep', label: 'Rep', icon: Star, route: ROUTES.COMMUNITIES.REPUTATION.path },
    ],
  },
  {
    key: 'assess',
    label: 'Assess',
    icon: ClipboardCheck,
    route: ROUTES.DASHBOARD.ASSESSMENTS.path,
    matchPrefixes: ['/dashboard/assessments', '/dashboard/career-explorer'],
    subItems: [
      { key: 'assess-analytics', label: 'Analytics', icon: BarChart3, route: ROUTES.DASHBOARD.ASSESSMENTS.ANALYTICS.path },
      { key: 'assess-pulse', label: 'Pulse', icon: Wrench, route: ROUTES.DASHBOARD.ASSESSMENTS.LUSCHER.path },
      { key: 'assess-personality', label: 'Personality', icon: User, route: ROUTES.DASHBOARD.ASSESSMENTS.IPIP.path },
      { key: 'assess-career', label: 'Career', icon: Compass, route: ROUTES.DASHBOARD.CAREER_EXPLORER.path },
    ],
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: User,
    route: ROUTES.DASHBOARD.PROFILE.path,
    matchPrefixes: ['/dashboard/profile'],
    subItems: [
      { key: 'profile-overview', label: 'Overview', icon: User, route: ROUTES.DASHBOARD.PROFILE.OVERVIEW.path, exact: true },
      { key: 'profile-resume', label: 'Resume', icon: ResumeIcon, route: ROUTES.DASHBOARD.PROFILE.RESUME.path },
      { key: 'profile-skills', label: 'Skills', icon: Star, route: ROUTES.DASHBOARD.PROFILE.SKILLS.path },
      { key: 'profile-exp', label: 'Exp', icon: Briefcase, route: ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path },
    ],
  },
]
