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

  const leftColumnWidth = !hasBothColumns ? '100%' : isDesktop ? '70%' : isTablet ? '60%' : '100%'
  const rightColumnWidth = !hasBothColumns ? '100%' : isDesktop ? '30%' : isTablet ? '40%' : '100%'
  const rightColumnMaxHeight = hasBothColumns
    ? isDesktop
      ? 620
      : isTablet
        ? 540
        : undefined
    : undefined

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
        <XStack
          gap={isSmallScreen ? '$3' : '$8'}
          flexDirection={isSmallScreen ? 'column' : 'row'}
          p={isSmallScreen ? '$3' : '$7'}
        >
          {hasLeftContent && (
            <YStack
              minW={isSmallScreen ? '100%' : 300}
              width={leftColumnWidth}
              maxW={leftColumnWidth}
              flexBasis={leftColumnWidth}
              flex={1}
            >
              {leftContent}
            </YStack>
          )}
          {hasRightContent && (
            <YStack
              minW={isSmallScreen ? '100%' : 300}
              width={rightColumnWidth}
              maxW={rightColumnWidth}
              flexBasis={rightColumnWidth}
              style={rightColumnMaxHeight ? { maxHeight: rightColumnMaxHeight } : undefined}
            >
              {rightColumnMaxHeight ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <YStack pb="$4">{rightContent}</YStack>
                </ScrollView>
              ) : (
                rightContent
              )}
            </YStack>
          )}
        </XStack>
      </YStack>
    </ScrollView>
  )
}
