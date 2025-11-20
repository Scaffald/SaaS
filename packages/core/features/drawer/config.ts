import { ROUTES, type RouteConfig } from '@app/core/constants/routes'
import type { TranslationKey } from '@app/core/locales'
import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardCheck,
  Map as MapIcon,
  User,
  Users,
} from '@tamagui/lucide-icons'

export interface AssessmentStatus {
  luscher1: {
    isCompleted: boolean
    isLoading: boolean
    isOnCooldown?: boolean
    nextAvailableAt?: string | null
  }
  ipip: { isCompleted: boolean; isLoading: boolean }
  luscher2: { isCompleted: boolean; isLoading: boolean }
  riasec: { isCompleted: boolean; isLoading: boolean }
  occupation: { isCompleted: boolean; isLoading: boolean }
}

/**
 * Maps assessment route keys to assessment status keys
 */
function getAssessmentStatusKey(routeKey: string): keyof AssessmentStatus | null {
  const mapping: Record<string, keyof AssessmentStatus> = {
    LUSCHER: 'luscher1',
    IPIP: 'ipip',
    RIASEC: 'riasec',
    OCCUPATION: 'occupation',
  }
  return mapping[routeKey] || null
}

/**
 * Converts a route configuration to a drawer item configuration
 */
function routeToDrawerItem(
  key: string,
  route: RouteConfig,
  options?: {
    isCompleted?: boolean
    isOnCooldown?: boolean
    routeKey?: string
  }
): DrawerItemConfig {
  return {
    key: key.toLowerCase().replace(/_/g, '-'),
    titleKey: route.title as TranslationKey,
    href: route.path,
    routeKey: options?.routeKey || key,
    icon: route.icon,
    isCompleted: options?.isCompleted,
    isOnCooldown: options?.isOnCooldown,
  }
}

/**
 * Generates drawer items dynamically from dashboard routes
 * @param options - Optional configuration for drawer items
 * @param options.assessmentStatus - Assessment completion status for checkmarks
 * @returns Array of drawer item configurations
 */
export const generateDashboardDrawerItems = (options?: {
  assessmentStatus?: AssessmentStatus
}): DrawerItemConfig[] => {
  const items: DrawerItemConfig[] = []

  // Main dashboard item
  items.push({
    key: 'dashboard',
    titleKey: 'navigation.dashboard',
    href: ROUTES.DASHBOARD.path,
    routeKey: 'DASHBOARD',
    icon: BarChart3,
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

  // Employers - top-level item
  items.push({
    key: 'employers',
    titleKey: 'navigation.discoverEmployers',
    href: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path,
    routeKey: 'DASHBOARD_DISCOVER_EMPLOYERS',
    icon: Building2,
  })

  // Jobs - top-level item
  items.push({
    key: 'jobs',
    titleKey: 'navigation.discoverJobs',
    href: ROUTES.DASHBOARD.DISCOVER.JOBS.path,
    routeKey: 'DASHBOARD_DISCOVER_JOBS',
    icon: Briefcase,
  })

  // Profile route - Dynamically generate sub-items from nested route structure
  const profileSubItems: DrawerItemConfig[] = []

  // Iterate through profile routes and create drawer items
  // ROUTES.DASHBOARD.PROFILE is a RouteNode that contains both route properties and child routes
  const profileNode = ROUTES.DASHBOARD.PROFILE as Record<string, unknown>
  for (const [key, value] of Object.entries(profileNode)) {
    // Skip route config properties (path, title, etc.)
    if (key === 'path' || key === 'title' || key === 'protected' || key === 'exact' || key === 'icon') {
      continue
    }
    // Check if this is a RouteConfig (has path property)
    if (value && typeof value === 'object' && 'path' in value) {
      const routeConfig = value as RouteConfig
      if (!routeConfig.hidden) {
        profileSubItems.push(
          routeToDrawerItem(`profile-${key.toLowerCase()}`, routeConfig, {
            routeKey: `DASHBOARD_PROFILE_${key}`,
          })
        )
      }
    }
  }

  items.push({
    key: 'profile',
    titleKey: 'navigation.profile',
    href: ROUTES.DASHBOARD.PROFILE.path,
    routeKey: 'DASHBOARD_PROFILE',
    icon: User,
    isExpandable: true,
    expandOnActive: true,
    subItems: profileSubItems,
  })

  // Assessments route - Dynamically generate sub-items from nested route structure
  const assessmentSubItems: DrawerItemConfig[] = []

  // Iterate through assessment routes and create drawer items with status
  const assessmentsNode = ROUTES.DASHBOARD.ASSESSMENTS as Record<string, unknown>
  for (const [key, value] of Object.entries(assessmentsNode)) {
    // Skip route config properties (path, title, etc.)
    if (key === 'path' || key === 'title' || key === 'protected' || key === 'exact' || key === 'icon') {
      continue
    }
    // Check if this is a RouteConfig (has path property)
    if (value && typeof value === 'object' && 'path' in value) {
      const routeConfig = value as RouteConfig
      if (!routeConfig.hidden) {
        const statusKey = getAssessmentStatusKey(key)
        const status = statusKey ? options?.assessmentStatus?.[statusKey] : null

        assessmentSubItems.push(
          routeToDrawerItem(`assessment-${key.toLowerCase()}`, routeConfig, {
            routeKey: `DASHBOARD_ASSESSMENT_${key}`,
            isCompleted: status && 'isCompleted' in status ? status.isCompleted : undefined,
            isOnCooldown: status && 'isOnCooldown' in status ? status.isOnCooldown : undefined,
          })
        )
      }
    }
  }

  items.push({
    key: 'assessments',
    titleKey: 'navigation.assessments',
    href: ROUTES.DASHBOARD.ASSESSMENTS.path,
    routeKey: 'DASHBOARD_ASSESSMENTS',
    icon: ClipboardCheck,
    isExpandable: true,
    expandOnActive: true,
    subItems: assessmentSubItems,
  })

  return items
}

/**
 * Get drawer items for the drawer menu
 * @param options - Optional configuration for drawer items
 * @param options.assessmentStatus - Assessment completion status for checkmarks
 * @returns Array of drawer item configurations
 */
export const getDrawerItems = (options?: {
  assessmentStatus?: AssessmentStatus
}): DrawerItemConfig[] => {
  return generateDashboardDrawerItems(options)
}
