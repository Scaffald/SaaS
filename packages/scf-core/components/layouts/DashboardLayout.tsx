import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Row, Stack } from '@unicornlove/beyond-ui'
import { Breadcrumb, type BreadcrumbItem } from '@unicornlove/beyond-ui'
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
    <ScrollView flex={1} backgroundColor="$color3" showsVerticalScrollIndicator={false}>
      <Stack gap={12} paddingTop={12} paddingBottom={20}>
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal={8} paddingTop={12}>
            <Breadcrumb items={displayBreadcrumbs} />
          </Row>
        )}

        {/* Content Area - Responsive two-column or single-column layout */}
        <Row
          gap={12}
          flexDirection="column"
        >
          {leftContent && (
            <Stack
              width="100%"
            >
              {leftContent}
            </Stack>
          )}
          {rightContent && (
            <Stack
              width="100%"
            >
              {rightContent}
            </Stack>
          )}
        </Row>
      </Stack>
    </ScrollView>
  )
}
