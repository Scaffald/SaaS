import type { ReactNode } from 'react'
import { ScrollView, XStack, YStack } from 'tamagui'
import { Breadcrumb, type BreadcrumbItem } from '@scaffald/neue-ui'
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

  const hasBothColumns = Boolean(leftContent) && Boolean(rightContent)

  return (
    <ScrollView flex={1} bg="$color3" showsVerticalScrollIndicator={false}>
      <YStack gap="$3" pt="$3" pb="$5">
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <XStack px="$2" pt="$3" $md={{ px: '$7' }}>
            <Breadcrumb items={displayBreadcrumbs} />
          </XStack>
        )}

        {/* Content Area - Responsive two-column or single-column layout */}
        <XStack
          gap="$3"
          flexDirection="column"
          $md={{
            gap: '$8',
            p: '$7',
            flexDirection: 'row',
          }}
        >
          {leftContent && (
            <YStack
              width="100%"
              $md={{
                width: hasBothColumns ? undefined : '100%',
                flex: hasBothColumns ? 3 : undefined,
                minW: hasBothColumns ? 300 : undefined,
              }}
            >
              {leftContent}
            </YStack>
          )}
          {rightContent && (
            <YStack
              width="100%"
              $md={{
                width: hasBothColumns ? undefined : '100%',
                flex: hasBothColumns ? 2 : undefined,
                minW: hasBothColumns ? 300 : undefined,
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
