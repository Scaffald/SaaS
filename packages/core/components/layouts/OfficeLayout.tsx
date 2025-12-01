import type { RouteConfig } from '@app/core/constants/routes'
import { useTranslation } from '@app/core/utils/useTranslation'
import { getChildRoutes } from '@app/core/utils/navigation/routeHierarchy'
import { usePathname } from '@app/core/utils/usePathname'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { ScrollView, useWindowDimensions, XStack, YStack } from 'tamagui'
import type { StackProps } from 'tamagui'
import { Breadcrumb, type BreadcrumbItem, Tab, TabGroup } from '@unicornlove/ui'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'

type OfficeLayoutProps = {
  rightContent?: ReactNode
  leftContent?: ReactNode
  /** Whether to show breadcrumb navigation (default: true) */
  showBreadcrumb?: boolean
  /** Manual breadcrumb items to override auto-generation */
  breadcrumbItems?: BreadcrumbItem[]
  /** Whether to auto-generate breadcrumbs from route (default: true) */
  autoGenerateBreadcrumbs?: boolean
  /** Optional props for the main content wrapper */
  contentProps?: StackProps
  /** Optional props for the left column wrapper */
  leftContainerProps?: StackProps
  /** Optional props for the right column wrapper */
  rightContainerProps?: StackProps
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
  showBreadcrumb = false,
  breadcrumbItems,
  autoGenerateBreadcrumbs = true,
  contentProps,
  leftContainerProps,
  rightContainerProps,
}: OfficeLayoutProps) => {
  const pathname = usePathname()
  const currentPath = pathname ?? ''
  const { width } = useWindowDimensions()
  const isSmallScreen = width <= 800
  const { t } = useTranslation()

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
    // Filter to only include routes that are direct children of /office
    // These will have paths like /office/applications, /office/cms, etc.
    // Exclude nested routes (which would have 4+ segments like /office/cms/jobs)
    return childRoutes.filter((route: RouteConfig) => {
      // Skip hidden routes
      if (route.hidden) {
        return false
      }
      const pathSegments = route.path.split('/').filter(Boolean)
      // Top-level routes have 2-3 segments:
      // - 2 segments: ['office', 'section'] e.g. /office/applications
      // - 3 segments: ['office', 'section', 'subsection'] e.g. /office/cms (which is a container)
      // Exclude deeper nested routes (4+ segments)
      return pathSegments.length >= 2 && pathSegments.length <= 3 && pathSegments[0] === 'office'
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
        label: t(route.titleKey),
        href: route.path,
      })),
    [t, topLevelRoutes]
  )

  const activeTopRoute = useMemo(() => {
    return (
      topLevelRoutes.find((route) => isPathActive(currentPath, route.path)) ?? topLevelRoutes[0]
    )
  }, [currentPath, topLevelRoutes])

  const activeTabValue = useMemo(() => {
    const activeItem = tabItems.find((item: TabItem) => isPathActive(currentPath, item.href))
    return activeItem?.key ?? tabItems[0]?.key ?? ''
  }, [currentPath, tabItems])

  const secondaryTabItems = useMemo<TabItem[]>(() => {
    if (!activeTopRoute) {
      return []
    }

    const parentPath = activeTopRoute.path
    const shouldShowSecondaryTabs =
      parentPath.startsWith('/office/cms') || parentPath.startsWith('/office/ats')
    if (!shouldShowSecondaryTabs) {
      return []
    }

    const children = getChildRoutes(parentPath)

    return children
      .filter((route) => {
        if (route.hidden) {
          return false
        }
        const normalizedChild = route.path.replace(/\/$/, '')
        const normalizedParent = parentPath.replace(/\/$/, '')
        if (normalizedChild === normalizedParent) {
          return false
        }
        if (normalizedChild.includes('/:')) {
          return false
        }
        return true
      })
      .map((route) => ({
        key: route.path,
        label: t(route.titleKey),
        href: route.path,
      }))
  }, [activeTopRoute, t])

  const activeSecondaryValue = useMemo(() => {
    if (secondaryTabItems.length === 0) {
      return ''
    }
    const activeItem = secondaryTabItems.find((item) => isPathActive(currentPath, item.href))
    return activeItem?.key ?? secondaryTabItems[0]?.key ?? ''
  }, [currentPath, secondaryTabItems])

  const hasLeftContent = Boolean(leftContent)
  const hasRightContent = Boolean(rightContent)
  const hasBothColumns = hasLeftContent && hasRightContent

  const { $md: contentMdProps, ...restContentProps } = contentProps ?? {}
  const { $md: leftMdProps, ...restLeftContainerProps } = leftContainerProps ?? {}
  const { $md: rightMdProps, ...restRightContainerProps } = rightContainerProps ?? {}

  const handleTabChange = () => {
    // Navigation is handled by Link components in Tab
  }

  return (
    <ScrollView flex={1} bg="$color3" showsVerticalScrollIndicator={false}>
      <YStack gap="$3" pt="$3" pb="$5">
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <XStack px="$3" pt="$3" $md={{ px: '$7' }}>
            <Breadcrumb items={displayBreadcrumbs} />
          </XStack>
        )}

        {/* TabGroup Navigation - Top-level office routes */}
        {tabItems.length > 0 && (
          <>
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
            {secondaryTabItems.length > 0 && (
              <XStack px="$3" $md={{ px: '$7' }}>
                <TabGroup
                  value={activeSecondaryValue}
                  onValueChange={handleTabChange}
                  ariaLabel="Office subsection navigation"
                  scrollable={isSmallScreen}
                  bordered={false}
                >
                  {secondaryTabItems.map((item: TabItem) => (
                    <Tab key={item.key} value={item.key} label={item.label} href={item.href} />
                  ))}
                </TabGroup>
              </XStack>
            )}
          </>
        )}

        {/* Content Area - Use programmatic responsive flexDirection */}
        <XStack
          gap="$3"
          p="$3"
          flexDirection="column"
          {...restContentProps}
          $md={{
            gap: '$8',
            p: '$7',
            flexDirection: 'row',
            ...(contentMdProps ?? {}),
          }}
        >
          {hasLeftContent && (
            <YStack
              minW="100%"
              width="100%"
              maxW="100%"
              flexBasis="auto"
              {...restLeftContainerProps}
              $md={{
                minW: hasBothColumns ? 300 : 'auto',
                width: hasBothColumns ? '60%' : '100%',
                maxW: hasBothColumns ? '60%' : '100%',
                flexBasis: hasBothColumns ? '60%' : 'auto',
                flex: hasBothColumns ? 1 : undefined,
                ...(leftMdProps ?? {}),
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
              {...restRightContainerProps}
              $md={{
                minW: hasBothColumns ? 300 : 'auto',
                width: hasBothColumns ? '40%' : '100%',
                maxW: hasBothColumns ? '40%' : '100%',
                flexBasis: hasBothColumns ? '40%' : 'auto',
                ...(rightMdProps ?? {}),
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
