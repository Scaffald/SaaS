import type { RouteConfig } from '@scf/core/constants/routes'
import { ScrollView } from 'react-native'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { getChildRoutes } from '@scf/core/utils/navigation/routeHierarchy'
import { usePathname } from '@scf/core/utils/usePathname'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useWindowDimensions, Row, Stack } from '@scaffald/ui'
import type { StackProps } from '@scaffald/ui'
import { Breadcrumb, type BreadcrumbItemData, Tabs } from '@scaffald/ui'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'

type OfficeLayoutProps = {
  rightContent?: ReactNode
  leftContent?: ReactNode
  /** Whether to show breadcrumb navigation (default: true) */
  showBreadcrumb?: boolean
  /** Manual breadcrumb items to override auto-generation */
  breadcrumbItems?: BreadcrumbItemData[]
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

  // Calculate current index (last item is always active)
  const currentIndex = displayBreadcrumbs.length - 1

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
  const _hasBothColumns = hasLeftContent && hasRightContent

  const { $md: contentMdProps, ...restContentProps } = contentProps ?? {}
  const { $md: leftMdProps, ...restLeftContainerProps } = leftContainerProps ?? {}
  const { $md: rightMdProps, ...restRightContainerProps } = rightContainerProps ?? {}

  const handleTabChange = () => {
    // Navigation is handled by Link components in Tab
  }

  return (
    <ScrollView flex={1} backgroundColor="$color3" showsVerticalScrollIndicator={false}>
      <Stack gap={12} paddingTop={12} paddingBottom={20}>
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal={12} paddingTop={12}>
            <Breadcrumb items={displayBreadcrumbs} currentIndex={currentIndex} />
          </Row>
        )}

        {/* Tabs Navigation - Top-level office routes */}
        {tabItems.length > 0 && (
          <>
            <Row paddingHorizontal={12}>
              <Tabs
                value={activeTabValue}
                onValueChange={handleTabChange}
                type="line"
                orientation="horizontal"
              >
                {tabItems.map((item: TabItem) => (
                  <Tabs.Item key={item.key} value={item.key}>
                    <Tabs.Trigger>{item.label}</Tabs.Trigger>
                  </Tabs.Item>
                ))}
              </Tabs>
            </Row>
            {secondaryTabItems.length > 0 && (
              <Row paddingHorizontal={12}>
                <Tabs
                  value={activeSecondaryValue}
                  onValueChange={handleTabChange}
                  type="default"
                  orientation="horizontal"
                >
                  {secondaryTabItems.map((item: TabItem) => (
                    <Tabs.Item key={item.key} value={item.key}>
                      <Tabs.Trigger>{item.label}</Tabs.Trigger>
                    </Tabs.Item>
                  ))}
                </Tabs>
              </Row>
            )}
          </>
        )}

        {/* Content Area - Use programmatic responsive flexDirection */}
        <Row gap={12} padding={12} flexDirection="column" {...restContentProps}>
          {hasLeftContent && (
            <Stack minWidth="100%" width="100%" maxWidth="100%" {...restLeftContainerProps}>
              {leftContent}
            </Stack>
          )}
          {hasRightContent && (
            <Stack minWidth="100%" width="100%" maxWidth="100%" {...restRightContainerProps}>
              {rightContent}
            </Stack>
          )}
        </Row>
      </Stack>
    </ScrollView>
  )
}
