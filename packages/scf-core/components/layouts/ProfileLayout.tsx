import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Row, Stack } from '@scaffald/ui'
import { Breadcrumb, type BreadcrumbItemData } from '@scaffald/ui'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'
import { ProfileTabs } from '../navigation/ProfileTabs'

type ProfileLayoutProps = {
  rightContent: ReactNode
  leftContent: ReactNode
  /** Whether to show tab navigation (default: true) */
  showTabs?: boolean
  /** Whether to show breadcrumb navigation (default: true) */
  showBreadcrumb?: boolean
  /** Manual breadcrumb items to override auto-generation */
  breadcrumbItems?: BreadcrumbItemData[]
  /** Whether to auto-generate breadcrumbs from route (default: true) */
  autoGenerateBreadcrumbs?: boolean
}

export const ProfileLayout = ({
  rightContent,
  leftContent,
  showTabs = true,
  showBreadcrumb = false,
  breadcrumbItems,
  autoGenerateBreadcrumbs = true,
}: ProfileLayoutProps) => {
  // Auto-generate breadcrumbs if enabled and no manual override
  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  // Determine which breadcrumbs to display
  const displayBreadcrumbs = breadcrumbItems || breadcrumbs

  // Calculate current index (last item is always active)
  const currentIndex = displayBreadcrumbs.length - 1

  return (
    <ScrollView flex={1} backgroundColor="$color3" showsVerticalScrollIndicator={false}>
      <Stack gap={12} paddingTop="sm" paddingBottom="lg">
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal="xs" paddingTop="sm">
            <Breadcrumb items={displayBreadcrumbs} currentIndex={currentIndex} />
          </Row>
        )}

        {/* Tab Navigation - positioned at top */}
        {showTabs && <ProfileTabs marginHorizontal="$7" marginTop={12} />}

        {/* Content Area - Responsive two-column layout */}
        <Row gap={12} paddingHorizontal="sm" paddingTop="sm">
          <Stack width="100%">{leftContent}</Stack>
          <Stack width="100%">{rightContent}</Stack>
        </Row>
      </Stack>
    </ScrollView>
  )
}
