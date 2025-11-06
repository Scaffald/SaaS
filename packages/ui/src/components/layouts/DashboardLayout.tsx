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
          {leftContent && (
            <YStack minW={300} flex={2}>
              {leftContent}
            </YStack>
          )}
          {rightContent && (
            <YStack minW={300} flex={1}>
              {rightContent}
            </YStack>
          )}
        </XStack>
      </YStack>
    </ScrollView>
  )
}
