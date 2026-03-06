import type { ReactNode } from 'react'
import { ScrollView, useWindowDimensions } from 'react-native'
import { Grid, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Breadcrumb, type BreadcrumbItemData } from '@scaffald/ui'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'

/** Golden ratio (φ) for column proportion: left ~61.8%, right ~38.2% */
const GOLDEN_RATIO_TEMPLATE = 'minmax(300px, 1.618fr) minmax(300px, 1fr)'

type DashboardLayoutProps = {
  rightContent?: ReactNode
  leftContent?: ReactNode
  /** Whether to show breadcrumb navigation (default: true) */
  showBreadcrumb?: boolean
  /** Manual breadcrumb items to override auto-generation */
  breadcrumbItems?: BreadcrumbItemData[]
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
  const { theme } = useThemeContext()
  const isDesktop = width >= 1024
  const contentPadding = isDesktop ? '2xl' : 'lg'
  const verticalPadding = isDesktop ? '3xl' : 'sm'

  // Auto-generate breadcrumbs if enabled and no manual override
  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  // Determine which breadcrumbs to display
  const displayBreadcrumbs = breadcrumbItems || breadcrumbs

  // Calculate current index (last item is always active)
  const currentIndex = displayBreadcrumbs.length - 1

  const bgColor = colors.bg[theme].subtle

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      showsVerticalScrollIndicator={false}
    >
      <Stack gap={12} paddingTop={verticalPadding} paddingBottom={verticalPadding}>
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal={contentPadding}>
            <Breadcrumb items={displayBreadcrumbs} currentIndex={currentIndex} />
          </Row>
        )}

        {/* Content Area - Two-column golden ratio (lg+) or single column, min 300px per column */}
        <Stack paddingHorizontal={contentPadding}>
          <Grid
            columns={{ base: 1, lg: GOLDEN_RATIO_TEMPLATE }}
            gap={24}
            rowGap={24}
          >
            {leftContent ? <Stack>{leftContent}</Stack> : null}
            {rightContent ? <Stack>{rightContent}</Stack> : null}
          </Grid>
        </Stack>
      </Stack>
    </ScrollView>
  )
}
