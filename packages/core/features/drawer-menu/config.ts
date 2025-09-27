import type { JSX } from 'react'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'
import { BarChart3, Map, Users, Building2, User, Cog, Palette } from '@tamagui/lucide-icons'
import type { DrawerItemConfig, DrawerSectionConfig } from './types'

/**
 * Generates drawer items dynamically from dashboard routes
 * @returns Array of drawer item configurations
 */
export const generateDashboardDrawerItems = (): DrawerItemConfig[] => {
  const items: DrawerItemConfig[] = []

  // Main dashboard item
  items.push({
    key: 'dashboard',
    title: 'Dashboard',
    href: DASHBOARD_ROUTES.INDEX?.fullPath || '/dashboard',
    icon: BarChart3,
  })

  // Workers/Discover route
  const workersMapRoute = DASHBOARD_ROUTES.WORKERS?.childrenArray?.find(
    (r) => r.path === '/dashboard/workers/map'
  )
  if (workersMapRoute) {
    items.push({
      key: 'discover',
      title: 'Discover',
      href: workersMapRoute.fullPath,
      icon: Map,
    })
  }

  // Community route
  if (DASHBOARD_ROUTES.COMMUNITY) {
    items.push({
      key: 'community',
      title: 'Community',
      href: DASHBOARD_ROUTES.COMMUNITY.fullPath,
      icon: Users,
    })
  }

  // Organizations route
  if (DASHBOARD_ROUTES.ORGANIZATIONS) {
    items.push({
      key: 'organizations',
      title: 'Organizations',
      href: DASHBOARD_ROUTES.ORGANIZATIONS.fullPath,
      icon: Building2,
    })
  }

  // Profile route
  if (DASHBOARD_ROUTES.PROFILE) {
    items.push({
      key: 'profile',
      title: 'Profile',
      href: DASHBOARD_ROUTES.PROFILE.fullPath,
      icon: User,
    })
  }

  // Settings route
  if (DASHBOARD_ROUTES.SETTINGS) {
    items.push({
      key: 'settings',
      title: 'Settings',
      href: DASHBOARD_ROUTES.SETTINGS.fullPath,
      icon: Cog,
    })
  }

  // Styleguide route (for development) - Make expandable with children
  if (DASHBOARD_ROUTES.STYLEGUIDE) {
    // Filter out the index route to avoid duplication with parent
    const styleguideChildren = (DASHBOARD_ROUTES.STYLEGUIDE.childrenArray || []).filter(
      (route) => route.path !== DASHBOARD_ROUTES.STYLEGUIDE?.path
    )

    items.push({
      key: 'styleguide',
      title: 'Styleguide',
      href: DASHBOARD_ROUTES.STYLEGUIDE.fullPath, // Keep href for direct navigation if needed
      icon: Palette,
      isExpandable: true,
      subItems: styleguideChildren.map((childRoute) => ({
        key: `styleguide-${childRoute.path.split('/').pop()}`,
        title: childRoute.title || 'Untitled',
        href: childRoute.fullPath,
        // No icon for child items
      })),
    })
  }

  return items
}

/**
 * Main drawer sections configuration
 */
export const drawerSections: DrawerSectionConfig[] = [
  {
    key: 'main',
    title: '',
    items: generateDashboardDrawerItems(),
  },
]
