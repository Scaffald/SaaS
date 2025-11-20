import type { ReactNode } from 'react'
import { ScrollView, XStack, YStack } from 'tamagui'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'
import { Breadcrumb, type BreadcrumbItem } from '../Breadcrumb'

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
export const OfficeLayout = ({
  rightContent,
  leftContent,
  showBreadcrumb = true,
  breadcrumbItems,
  autoGenerateBreadcrumbs = true,
}: OfficeLayoutProps) => {
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

  return (
    <ScrollView flex={1} bg="$color2" showsVerticalScrollIndicator={false}>
      <YStack gap="$3" pt="$3" pb="$5">
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <XStack px="$3" pt="$3" $md={{ px: '$7' }}>
            <Breadcrumb items={displayBreadcrumbs} />
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
