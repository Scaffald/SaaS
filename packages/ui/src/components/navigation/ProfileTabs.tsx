import { getChildRoutes } from '@app/core/utils/navigation/routeHierarchy'
import { usePathname } from '@app/core/utils/usePathname'
import { Link } from 'expo-router'
import { type JSX, useMemo } from 'react'
import {
  Button,
  type ButtonProps,
  Paragraph,
  ScrollView,
  useWindowDimensions,
  XStack,
  YStack,
} from 'tamagui'

export type ProfileTabsItem = {
  key: string
  label: string
  href: string
  badge?: string
  isActive?: boolean
  buttonProps?: ButtonProps
}

export type ProfileTabsProps = {
  ariaLabel?: string
}

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

export const ProfileTabs = ({ ariaLabel = 'Profile navigation' }: ProfileTabsProps) => {
  const pathname = usePathname()
  const currentPath = pathname ?? ''
  const { width } = useWindowDimensions()
  const isSmallScreen = width <= 800

  // Get child routes for /dashboard/profile
  const childRoutes = useMemo(() => {
    const routes = getChildRoutes('/dashboard/profile')
    // Debug: log routes if needed
    // console.log('Profile child routes:', routes)
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
        label: route.title ?? '',
        href: route.path,
      })),
    [directChildRoutes]
  )

  // Don't render if no items
  if (items.length === 0) {
    return null
  }

  const normalizedItems = useMemo(
    () =>
      items.map((item) => {
        const active = item.isActive ?? isPathActive(currentPath, item.href)
        return { ...item, isActive: active }
      }),
    [currentPath, items]
  )

  const renderTabButton = ({
    key,
    label,
    href,
    badge,
    isActive,
    buttonProps,
  }: ProfileTabsItem): JSX.Element => {
    const active = Boolean(isActive)

    const button = (
      <Button
        key={key}
        role="tab"
        aria-selected={active}
        variant={active ? undefined : 'outlined'}
        size="$3"
        borderColor={active ? '$color9' : '$borderColor'}
        bg={active ? '$color9' : 'transparent'}
        hoverStyle={{
          bg: active ? '$color9' : '$color3',
        }}
        pressStyle={{
          bg: active ? '$color9' : '$color4',
        }}
        {...buttonProps}
      >
        <XStack gap="$2" items="center">
          <Paragraph fontWeight="600" color={active ? '$color1' : '$color11'}>
            {label}
          </Paragraph>
          {badge ? (
            <YStack
              px="$2"
              py="$1"
              bg={active ? '$color2' : '$color4'}
              rounded="$10"
              items="center"
              justify="center"
            >
              <Paragraph size="$1" color={active ? '$color10' : '$color11'}>
                {badge}
              </Paragraph>
            </YStack>
          ) : null}
        </XStack>
      </Button>
    )

    return (
      <Link key={key} href={href} asChild>
        {button}
      </Link>
    )
  }

  if (isSmallScreen) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack px="$4" py="$2" gap="$2" role="tablist" aria-label={ariaLabel}>
          {normalizedItems.map(renderTabButton)}
        </XStack>
      </ScrollView>
    )
  }

  return (
    <YStack px="$4">
      <XStack gap="$2" role="tablist" aria-label={ariaLabel} flexWrap="wrap">
        {normalizedItems.map(renderTabButton)}
      </XStack>
    </YStack>
  )
}
