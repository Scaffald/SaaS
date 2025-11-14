import type { ReactNode } from 'react'
import { ScrollView, XStack, YStack, useMedia } from 'tamagui'
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
  // Auto-generate breadcrumbs if enabled and no manual override
  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  // Determine which breadcrumbs to display
  const displayBreadcrumbs = breadcrumbItems || breadcrumbs

  // Use media hook for reliable responsive behavior on native
  const media = useMedia()
  const isMobile = media.sm // sm = maxWidth: 800px

  const hasLeftContent = Boolean(leftContent)
  const hasRightContent = Boolean(rightContent)
  const hasBothColumns = hasLeftContent && hasRightContent

  return (
    <ScrollView flex={1} bg="$color2" showsVerticalScrollIndicator={false}>
      <YStack gap="$3" pt="$3" pb="$5">
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <XStack px={isMobile ? '$2' : '$7'} pt="$3">
            <Breadcrumb items={displayBreadcrumbs} />
          </XStack>
        )}

        {/* Content Area - Use programmatic responsive flexDirection */}
        <XStack
          gap={isMobile ? '$3' : '$8'}
          p={isMobile ? '$2' : '$7'}
          flexDirection={isMobile ? 'column' : 'row'}
        >
          {hasLeftContent && (
            <YStack
              minW={isMobile ? '100%' : hasBothColumns ? 300 : 'auto'}
              width="100%"
              maxW="100%"
              flexBasis="auto"
              flex={isMobile ? undefined : hasBothColumns ? 1 : undefined}
              $gtSm={{
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
              minW={isMobile ? '100%' : hasBothColumns ? 300 : 'auto'}
              width="100%"
              maxW="100%"
              flexBasis="auto"
              $gtSm={{
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
