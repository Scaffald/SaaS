import type { ReactNode } from 'react'
import { useWindowDimensions, ScrollView, XStack, YStack } from 'tamagui'
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'

type DashboardLayoutProps = {
  rightContent?: ReactNode
  leftContent?: ReactNode
  /** Whether to show breadcrumb navigation (default: true) */
  showBreadcrumb?: boolean
  /** Manual breadcrumb items to override auto-generation */
  breadcrumbItems?: BreadcrumbItem[]
  /** Whether to auto-generate breadcrumbs from route (default: true) */
  autoGenerateBreadcrumbs?: boolean
}

export const DashboardLayout = ({
  rightContent,
  leftContent,
  showBreadcrumb = true,
  breadcrumbItems,
  autoGenerateBreadcrumbs = true,
}: DashboardLayoutProps) => {
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640
  const isTablet = width >= 640 && width < 1024
  const isDesktop = width >= 1024

  // Auto-generate breadcrumbs if enabled and no manual override
  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  // Determine which breadcrumbs to display
  const displayBreadcrumbs = breadcrumbItems || breadcrumbs

  const hasLeftContent = Boolean(leftContent)
  const hasRightContent = Boolean(rightContent)
  const hasBothColumns = hasLeftContent && hasRightContent

  const leftColumnWidth =
    !hasBothColumns || isSmallScreen ? '100%' : isDesktop ? '70%' : isTablet ? '60%' : '100%'
  const rightColumnWidth =
    !hasBothColumns || isSmallScreen ? '100%' : isDesktop ? '30%' : isTablet ? '40%' : '100%'

  const ContentStack = isSmallScreen ? YStack : XStack

  return (
    <ScrollView flex={1} bg="$color2" showsVerticalScrollIndicator={false}>
      <YStack gap="$3" pt="$3" pb="$5">
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <XStack px={isSmallScreen ? '$3' : '$7'} pt="$3">
            <Breadcrumb items={displayBreadcrumbs} />
          </XStack>
        )}

        {/* Content Area */}
        <ContentStack gap={isSmallScreen ? '$3' : '$8'} p={isSmallScreen ? '$3' : '$7'}>
          {hasLeftContent && (
            <YStack
              minW={isSmallScreen ? '100%' : 300}
              width={isSmallScreen ? '100%' : leftColumnWidth}
              maxW={isSmallScreen ? '100%' : leftColumnWidth}
              flexBasis={!isSmallScreen && hasBothColumns ? leftColumnWidth : 'auto'}
              flex={!isSmallScreen && hasBothColumns ? 1 : undefined}
            >
              {leftContent}
            </YStack>
          )}
          {hasRightContent && (
            <YStack
              minW={isSmallScreen ? '100%' : 300}
              width={isSmallScreen ? '100%' : rightColumnWidth}
              maxW={isSmallScreen ? '100%' : rightColumnWidth}
              flexBasis={!isSmallScreen && hasBothColumns ? rightColumnWidth : 'auto'}
            >
              {rightContent}
            </YStack>
          )}
        </ContentStack>
      </YStack>
    </ScrollView>
  )
}
