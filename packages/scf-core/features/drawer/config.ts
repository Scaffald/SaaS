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
  Map as MapIcon,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react-native'
import type { DrawerItemConfig } from './types'

/**
 * Generates drawer items dynamically from dashboard routes
 * @returns Array of drawer item configurations
 */
export const generateDashboardDrawerItems = (): DrawerItemConfig[] => {
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
      { key: 'dashboard-index', titleKey: 'routes.dashboard.home', href: ROUTES.DASHBOARD.path },
      { key: 'dashboard-news', titleKey: ROUTES.DASHBOARD.NEWS.titleKey, href: ROUTES.DASHBOARD.NEWS.path },
    ],
  })

  // Map - top-level item
  items.push({
    key: 'map',
    titleKey: 'navigation.discoverMap',
    href: ROUTES.DASHBOARD.DISCOVER.MAP.path,
    routeKey: 'DASHBOARD_DISCOVER_MAP',
    icon: MapIcon,
  })

  // Workers - top-level item
  items.push({
    key: 'workers',
    titleKey: 'navigation.discoverWorkers',
    href: ROUTES.DASHBOARD.DISCOVER.WORKERS.path,
    routeKey: 'DASHBOARD_DISCOVER_WORKERS',
    icon: Users,
  })

  // Employers - expandable with create
  items.push({
    key: 'employers',
    titleKey: 'navigation.discoverEmployers',
    href: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path,
    routeKey: 'DASHBOARD_DISCOVER_EMPLOYERS',
    icon: Building2,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'employers-index', titleKey: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.titleKey, href: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path },
      { key: 'employers-create', titleKey: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.CREATE.titleKey, href: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.CREATE.path },
    ],
  })

  // Jobs - expandable with applications
  items.push({
    key: 'jobs',
    titleKey: 'navigation.discoverJobs',
    href: ROUTES.DASHBOARD.DISCOVER.JOBS.path,
    routeKey: 'DASHBOARD_DISCOVER_JOBS',
    icon: Briefcase,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'jobs-index', titleKey: ROUTES.DASHBOARD.DISCOVER.JOBS.titleKey, href: ROUTES.DASHBOARD.DISCOVER.JOBS.path },
      { key: 'jobs-applications', titleKey: ROUTES.DASHBOARD.DISCOVER.JOBS.APPLICATIONS.titleKey, href: ROUTES.DASHBOARD.DISCOVER.JOBS.APPLICATIONS.path },
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
      { key: 'profile-overview', titleKey: ROUTES.DASHBOARD.PROFILE.OVERVIEW.titleKey, href: ROUTES.DASHBOARD.PROFILE.OVERVIEW.path },
      { key: 'profile-general', titleKey: ROUTES.DASHBOARD.PROFILE.GENERAL.titleKey, href: ROUTES.DASHBOARD.PROFILE.GENERAL.path },
      { key: 'profile-employment', titleKey: ROUTES.DASHBOARD.PROFILE.EMPLOYMENT.titleKey, href: ROUTES.DASHBOARD.PROFILE.EMPLOYMENT.path },
      { key: 'profile-skills', titleKey: ROUTES.DASHBOARD.PROFILE.SKILLS.titleKey, href: ROUTES.DASHBOARD.PROFILE.SKILLS.path },
      { key: 'profile-certifications', titleKey: ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.titleKey, href: ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.path },
      { key: 'profile-education', titleKey: ROUTES.DASHBOARD.PROFILE.EDUCATION.titleKey, href: ROUTES.DASHBOARD.PROFILE.EDUCATION.path },
      { key: 'profile-experience', titleKey: ROUTES.DASHBOARD.PROFILE.EXPERIENCE.titleKey, href: ROUTES.DASHBOARD.PROFILE.EXPERIENCE.path },
      { key: 'profile-id-verification', titleKey: ROUTES.DASHBOARD.PROFILE.ID_VERIFICATION.titleKey, href: ROUTES.DASHBOARD.PROFILE.ID_VERIFICATION.path },
      { key: 'profile-resume', titleKey: ROUTES.DASHBOARD.PROFILE.RESUME.titleKey, href: ROUTES.DASHBOARD.PROFILE.RESUME.path },
      { key: 'profile-background-check', titleKey: ROUTES.DASHBOARD.PROFILE.BACKGROUND_CHECK.titleKey, href: ROUTES.DASHBOARD.PROFILE.BACKGROUND_CHECK.path },
    ],
  })

  // Settings: not in main nav; use drawer footer link to /dashboard/settings

  // Communities - expandable (top-level /communities section); full drawer nav shown on /communities like /office
  items.push({
    key: 'communities',
    titleKey: ROUTES.COMMUNITIES.titleKey,
    href: ROUTES.COMMUNITIES.path,
    routeKey: 'COMMUNITIES',
    icon: Bookmark,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      { key: 'communities-hub', titleKey: ROUTES.COMMUNITIES.titleKey, href: ROUTES.COMMUNITIES.path },
      { key: 'communities-connections', titleKey: ROUTES.COMMUNITIES.CONNECTIONS.titleKey, href: ROUTES.COMMUNITIES.CONNECTIONS.path },
      { key: 'communities-bookmarks', titleKey: ROUTES.COMMUNITIES.BOOKMARKS.titleKey, href: ROUTES.COMMUNITIES.BOOKMARKS.path },
      { key: 'communities-reputation', titleKey: ROUTES.COMMUNITIES.REPUTATION.titleKey, href: ROUTES.COMMUNITIES.REPUTATION.path },
    ],
  })

  // Teams and Work Logs are only under My Organizations (org-scoped); no top-level items here.

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
 * Build the "My Organizations" drawer item with nested orgs and their Teams/Logs.
 * Only include when memberships.length > 0. Dedupe by organization_id.
 */
export const buildMyOrganizationsDrawerItem = (
  memberships: OrganizationMembership[]
): DrawerItemConfig | null => {
  const seen = new Set<string>()
  const orgs = memberships.filter((m) => {
    if (seen.has(m.organization_id)) return false
    seen.add(m.organization_id)
    return true
  })
  if (orgs.length === 0) return null
  return {
    key: 'my-organizations',
    titleKey: ROUTES.ORG.titleKey,
    href: ROUTES.ORG.path,
    routeKey: 'ORG',
    icon: Building2,
    isExpandable: true,
    expandOnActive: true,
    subItems: [
      {
        key: 'org-invitations',
        titleKey: ROUTES.ORG.INVITATIONS.titleKey,
        href: ROUTES.ORG.INVITATIONS.path,
      },
      ...orgs.map((m) => ({
        key: `org-${m.organization_slug}`,
        title: m.organization_name,
        href: `/org/${m.organization_slug}`,
        isExpandable: true,
        expandOnActive: true,
        subItems: [
          {
            key: `org-${m.organization_slug}-teams`,
            titleKey: ROUTES.DASHBOARD.TEAMS.titleKey,
            href: `/org/${m.organization_slug}/teams`,
          },
          {
            key: `org-${m.organization_slug}-logs`,
            titleKey: ROUTES.ORG.DETAIL.LOGS.titleKey,
            href: `/org/${m.organization_slug}/logs`,
          },
        ],
      })),
    ],
  }
}

/**
 * Get drawer items for the drawer menu
 * @param memberships - Optional org memberships; when present and non-empty, "My Organizations" is inserted before Profile
 */
export const getDrawerItems = (memberships?: OrganizationMembership[]): DrawerItemConfig[] => {
  const items = generateDashboardDrawerItems()
  const myOrgs = memberships?.length ? buildMyOrganizationsDrawerItem(memberships) : null
  if (!myOrgs) return items
  const profileIndex = items.findIndex((i) => i.key === 'profile')
  const insertAt = profileIndex >= 0 ? profileIndex : items.length
  return [...items.slice(0, insertAt), myOrgs, ...items.slice(insertAt)]
}
