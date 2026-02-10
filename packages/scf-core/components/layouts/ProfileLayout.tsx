import type { ReactNode } from 'react'
import { ScrollView, Row, Stack } from '@unicornlove/beyond-ui'
import { Breadcrumb, type BreadcrumbItem } from '@unicornlove/beyond-ui'
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
  breadcrumbItems?: BreadcrumbItem[]
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

  return (
    <ScrollView flex={1} backgroundColor="$color3" showsVerticalScrollIndicator={false}>
      <Stack gap="$3" paddingTop="$3" paddingBottom="$5">
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal="$2" paddingTop="$3" $md={{ paddingHorizontal: '$7' }}>
            <Breadcrumb items={displayBreadcrumbs} />
          </Row>
        )}

        {/* Tab Navigation - positioned at top */}
        {showTabs && <ProfileTabs marginHorizontal="$7" marginTop="$3" />}

        {/* Content Area - Responsive two-column layout */}
        <Row
          gap="$3"
          paddingHorizontal="$3"
          paddingTop="$3"
          flexDirection="column"
          $md={{
            gap: '$8',
            paddingHorizontal: '$7',
            paddingTop: '$3',
            flexDirection: 'row',
          }}
        >
          <Stack
            width="100%"
            $md={{
              width: undefined,
              flex: 3,
              minWidth: 300,
            }}
          >
            {leftContent}
          </Stack>
          <Stack
            width="100%"
            $md={{
              width: undefined,
              flex: 2,
              minWidth: 300,
            }}
          >
            {rightContent}
          </Stack>
        </Row>
      </Stack>
    </ScrollView>
  )
}
