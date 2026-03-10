import type { ReactNode } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Row, Stack, useResponsive } from '@scaffald/ui'
import { Breadcrumb, type BreadcrumbItemData } from '@scaffald/ui'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'
import { ProfileTabs } from '../navigation/ProfileTabs'

/** Golden ratio (φ) for column proportion: left ~61.8%, right ~38.2% */
const GOLDEN_RATIO_TEMPLATE = 'minmax(300px, 1.618fr) minmax(300px, 1fr)'

type ProfileLayoutProps = {
  rightContent?: ReactNode
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
  const { isDesktop } = useResponsive()
  const contentPadding = isDesktop ? '2xl' : 'lg'
  const _verticalPadding = isDesktop ? '3xl' : 'sm'
  const _columnGap = isDesktop ? 48 : 24
  const _columnTemplate = rightContent ? GOLDEN_RATIO_TEMPLATE : '1fr'

  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  const displayBreadcrumbs = breadcrumbItems || breadcrumbs
  const currentIndex = displayBreadcrumbs.length - 1

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Stack gap={24} paddingTop="sm" paddingBottom="lg">
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal={contentPadding}>
            <Breadcrumb items={displayBreadcrumbs} currentIndex={currentIndex} />
          </Row>
        )}

        {showTabs && (
          <Stack paddingHorizontal={contentPadding}>
            <ProfileTabs />
          </Stack>
        )}

        {/* Content Area - Responsive two-column layout */}
        <Row gap={24} paddingHorizontal="lg" paddingTop="sm">
          <Stack width="100%">{leftContent}</Stack>
          <Stack width="100%">{rightContent}</Stack>
        </Row>
      </Stack>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f8f9f8' },
})
