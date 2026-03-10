import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Grid, Row, Stack, useThemeContext, useResponsive } from '@scaffald/ui'
import { Breadcrumb, type BreadcrumbItemData } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const contentPadding = isDesktop ? '2xl' : 'lg'
  const verticalPadding = isDesktop ? '3xl' : 'sm'
  const columnGap = isDesktop ? 48 : 24
  const columnTemplate = rightContent ? GOLDEN_RATIO_TEMPLATE : '1fr'

  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  const displayBreadcrumbs = breadcrumbItems || breadcrumbs
  const currentIndex = displayBreadcrumbs.length - 1

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg[theme].subtle }}
      showsVerticalScrollIndicator={false}
    >
      <Stack gap={12} paddingTop={verticalPadding} paddingBottom={verticalPadding}>
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

        <Stack paddingHorizontal={contentPadding}>
          <Grid
            columns={{ base: 1, lg: columnTemplate }}
            gap={columnGap}
            rowGap={isDesktop ? 32 : 24}
          >
            <Stack>{leftContent}</Stack>
            {rightContent ? <Stack>{rightContent}</Stack> : null}
          </Grid>
        </Stack>
      </Stack>
    </ScrollView>
  )
}
