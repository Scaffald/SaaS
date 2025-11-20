import type { RouteConfig } from '@app/core/constants/routes'
import { getChildRoutes } from '@app/core/utils/navigation/routeHierarchy'
import { usePathname } from '@app/core/utils/usePathname'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { ScrollView, useWindowDimensions, XStack, YStack } from 'tamagui'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb'
import { Tab } from '../navigation/Tab'
import { TabGroup } from '../navigation/TabGroup'

type OfficeLayoutProps = {
  rightContent?: ReactNode
  leftContent?: ReactNode
  /** Whether to show breadcrumb navigation (default: true) */
  showBreadcrumb?: boolean
  /** Manual breadcrumb items to override auto-generation */
  breadcrumbItems?: BreadcrumbItem[]
  /** Whether to auto-generate breadcrumbs from route (default: true) */
  autoGenerateBreadcrumbs?: boolean
}

/**
 * OfficeLayout component for Office section pages
 *
 * A thin wrapper around DashboardLayout with Office-specific defaults.
 * Provides consistent two-column layout with breadcrumbs for all Office pages.
 *
 * @example
 * ```tsx
 * <OfficeLayout
 *   leftContent={<OfficePageLayout ... />}
 *   rightContent={<QuickActionsWidget ... />}
 * />
 * ```
 */
const isPathActive = (currentPath: string, targetHref: string) => {
  if (!targetHref) return false

  const normalizedCurrent = currentPath.replace(/\/$/, '')
  const normalizedTarget = targetHref.replace(/\/$/, '')

  if (normalizedCurrent === normalizedTarget) {
    return true
  }

  const base = normalizedTarget.split('/:')[0]
  if (!base) {
    return false
  }

  // For top-level office routes, match exact or sub-paths
  if (normalizedTarget.startsWith('/office/')) {
    return normalizedCurrent === base || normalizedCurrent.startsWith(`${base}/`)
  }

  return normalizedCurrent === base || normalizedCurrent.startsWith(`${base}/`)
}

export const OfficeLayout = ({
  rightContent,
  leftContent,
  showBreadcrumb = true,
  breadcrumbItems,
  autoGenerateBreadcrumbs = true,
}: OfficeLayoutProps) => {
  const pathname = usePathname()
  const currentPath = pathname ?? ''
  const { width } = useWindowDimensions()
  const isSmallScreen = width <= 800

  // Auto-generate breadcrumbs if enabled and no manual override
  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  // Determine which breadcrumbs to display
  const displayBreadcrumbs = breadcrumbItems || breadcrumbs

  // Get top-level office routes (direct children of /office)
  const childRoutes = useMemo(() => getChildRoutes('/office'), [])

  const topLevelRoutes = useMemo(() => {
    return childRoutes.filter((route: RouteConfig) => {
      const pathSegments = route.path.split('/').filter(Boolean)
      // Top-level routes have exactly 2 segments: ['office', 'section']
      return pathSegments.length === 2
    })
  }, [childRoutes])

  type TabItem = {
    key: string
    label: string
    href: string
  }

  const tabItems = useMemo<TabItem[]>(
    () =>
      topLevelRoutes.map((route: RouteConfig) => ({
        key: route.path,
        label: route.title ?? '',
        href: route.path,
      })),
    [topLevelRoutes]
  )

  const activeTabValue = useMemo(() => {
    const activeItem = tabItems.find((item: TabItem) => isPathActive(currentPath, item.href))
    return activeItem?.key ?? tabItems[0]?.key ?? ''
  }, [currentPath, tabItems])

  const hasLeftContent = Boolean(leftContent)
  const hasRightContent = Boolean(rightContent)
  const hasBothColumns = hasLeftContent && hasRightContent

  const handleTabChange = () => {
    // Navigation is handled by Link components in Tab
  }

  return (
    <ScrollView flex={1} bg="$color2" showsVerticalScrollIndicator={false}>
      <YStack gap="$3" pt="$3" pb="$5">
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <XStack px="$3" pt="$3" $md={{ px: '$7' }}>
            <Breadcrumb items={displayBreadcrumbs} />
          </XStack>
        )}

        {/* TabGroup Navigation - Top-level office routes */}
        {tabItems.length > 0 && (
          <XStack px="$3" $md={{ px: '$7' }}>
            <TabGroup
              value={activeTabValue}
              onValueChange={handleTabChange}
              ariaLabel="Office navigation"
              scrollable={isSmallScreen}
              bordered={true}
            >
              {tabItems.map((item: TabItem) => (
                <Tab key={item.key} value={item.key} label={item.label} href={item.href} />
              ))}
            </TabGroup>
          </XStack>
        )}

        {/* Content Area - Use programmatic responsive flexDirection */}
        <XStack
          gap="$3"
          p="$3"
          flexDirection="column"
          $md={{
            gap: '$8',
            p: '$7',
            flexDirection: 'row',
          }}
        >
          {hasLeftContent && (
            <YStack
              minW="100%"
              width="100%"
              maxW="100%"
              flexBasis="auto"
              $md={{
                minW: hasBothColumns ? 300 : 'auto',
                width: hasBothColumns ? '60%' : '100%',
                maxW: hasBothColumns ? '60%' : '100%',
                flexBasis: hasBothColumns ? '60%' : 'auto',
                flex: hasBothColumns ? 1 : undefined,
              }}
            >
              {leftContent}
            </YStack>
          )}
          {hasRightContent && (
            <YStack
              minW="100%"
              width="100%"
              maxW="100%"
              flexBasis="auto"
              $md={{
                minW: hasBothColumns ? 300 : 'auto',
                width: hasBothColumns ? '40%' : '100%',
                maxW: hasBothColumns ? '40%' : '100%',
                flexBasis: hasBothColumns ? '40%' : 'auto',
              }}
            >
              {rightContent}
            </YStack>
          )}
        </XStack>
      </YStack>
    </ScrollView>
  )
}
