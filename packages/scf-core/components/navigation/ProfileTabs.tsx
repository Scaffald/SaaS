import { getChildRoutes } from '@scf/core/utils/navigation/routeHierarchy'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { usePathname } from '@scf/core/utils/usePathname'
import { useMemo } from 'react'
import { useWindowDimensions } from '@scaffald/ui'
import { Tabs, type TabsProps } from '@scaffald/ui'

export type ProfileTabsItem = {
  key: string
  label: string
  href: string
  badge?: string
  isActive?: boolean
}

export type ProfileTabsProps = {
  ariaLabel?: string
} & Omit<TabsProps, 'value' | 'onValueChange' | 'children'>

const isPathActive = (currentPath: string, targetHref: string) => {
  if (!targetHref) return false

  // Normalize paths (remove trailing slashes)
  const normalizedCurrent = currentPath.replace(/\/$/, '')
  const normalizedTarget = targetHref.replace(/\/$/, '')

  if (normalizedCurrent === normalizedTarget) {
    return true
  }

  // Handle exact routes
  const base = normalizedTarget.split('/:')[0]
  if (!base) {
    return false
  }

  // Check if current path starts with base path
  // But exclude nested routes (e.g., background-check sub-routes)
  // Only match direct children of /dashboard/profile
  if (normalizedTarget.startsWith('/dashboard/profile/')) {
    // For direct profile children, match exactly or start with base
    // Exclude deeper nested routes
    const targetDepth = base.split('/').filter(Boolean).length
    const currentDepth = normalizedCurrent.split('/').filter(Boolean).length

    if (targetDepth === 3 && currentDepth >= 3) {
      // This is a direct child, check if it matches
      return normalizedCurrent === base || normalizedCurrent.startsWith(`${base}/`)
    }
  }

  return normalizedCurrent === base || normalizedCurrent.startsWith(`${base}/`)
}

export const ProfileTabs = ({
  ariaLabel = 'Profile navigation',
  ...tabsProps
}: ProfileTabsProps) => {
  const pathname = usePathname()
  const currentPath = pathname ?? ''
  const { width } = useWindowDimensions()
  const isSmallScreen = width <= 800
  const { t } = useTranslation()

  // Get child routes for /dashboard/profile
  const childRoutes = useMemo(() => {
    const routes = getChildRoutes('/dashboard/profile')
    return routes
  }, [])

  // Filter to only show direct children (exclude BACKGROUND_CHECK which has nested routes)
  // Direct children have depth 3: /dashboard/profile/general
  const directChildRoutes = useMemo(() => {
    return childRoutes.filter((route) => {
      // Exclude BACKGROUND_CHECK as it has its own nested navigation
      if (route.path === '/dashboard/profile/background-check') {
        return false
      }
      // Only include routes that are direct children (exact: true or are top-level profile routes)
      // Exclude routes with nested children
      const pathSegments = route.path.split('/').filter(Boolean)
      // Direct children should have exactly 3 segments: dashboard, profile, <route-name>
      return pathSegments.length === 3
    })
  }, [childRoutes])

  // Convert routes to tab items
  const items: ProfileTabsItem[] = useMemo(
    () =>
      directChildRoutes.map((route) => ({
        key: route.path,
        label: t(route.titleKey),
        href: route.path,
      })),
    [directChildRoutes, t]
  )

  // Find the currently active tab value
  const activeValue = useMemo(() => {
    const activeItem = items.find((item) => isPathActive(currentPath, item.href))
    return activeItem?.key ?? items[0]?.key ?? ''
  }, [currentPath, items])

  // Don't render if no items
  if (items.length === 0) {
    return null
  }

  const handleValueChange = (_value: string) => {
    // Navigation is handled by Link components
    // This is just for state management
  }

  return (
    <Tabs
      value={activeValue}
      onValueChange={handleValueChange}
      type="line"
      orientation="horizontal"
      {...tabsProps}
    >
      {items.map((item) => (
        <Tabs.Item key={item.key} value={item.key}>
          <Tabs.Trigger>{item.label}</Tabs.Trigger>
        </Tabs.Item>
      ))}
    </Tabs>
  )
}
