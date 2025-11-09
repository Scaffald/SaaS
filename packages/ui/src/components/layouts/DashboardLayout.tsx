import type { ReactNode } from 'react'
import { YStack, XStack, ScrollView, useWindowDimensions } from 'tamagui'
import { Breadcrumb, useBreadcrumbs, type BreadcrumbItem } from '@app/ui'

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

  const leftColumnWidth = isSmallScreen || !hasBothColumns ? '100%' : '60%'
  const rightColumnWidth = isSmallScreen || !hasBothColumns ? '100%' : '40%'

  return (
    <ScrollView flex={1} bg="$color2" pt="$3" pb="$5" showsVerticalScrollIndicator={false}>
      <YStack gap="$3">
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
            >
              {rightContent}
            </YStack>
          )}
        </XStack>
      </YStack>
    </ScrollView>
  )
}
