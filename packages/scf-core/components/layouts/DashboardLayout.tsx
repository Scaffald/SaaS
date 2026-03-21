import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Grid, Row, Stack, useThemeContext, useResponsive } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Breadcrumb, type BreadcrumbItemData } from '@scaffald/ui'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'

/** Golden ratio (φ) for column proportion: left ~61.8%, right ~38.2% */
const GOLDEN_RATIO_TEMPLATE = 'minmax(300px, 1.618fr) minmax(300px, 1fr)'

type DashboardLayoutProps = {
  rightContent?: ReactNode
  leftContent?: ReactNode
  /** Full-width header rendered above the grid (search bars, filter toolbars, etc.) */
  headerContent?: ReactNode
  /** Whether to show breadcrumb navigation (default: true) */
  showBreadcrumb?: boolean
  /** Manual breadcrumb items to override auto-generation */
  breadcrumbItems?: BreadcrumbItemData[]
  /** Whether to auto-generate breadcrumbs from route (default: true) */
  autoGenerateBreadcrumbs?: boolean
  /** Expand content to full width (single column, no right panel) */
  fullWidth?: boolean
}

export const DashboardLayout = ({
  rightContent,
  leftContent,
  headerContent,
  showBreadcrumb = true,
  breadcrumbItems,
  autoGenerateBreadcrumbs = true,
  fullWidth = false,
}: DashboardLayoutProps) => {
  const { isDesktop } = useResponsive()
  const { theme } = useThemeContext()
  const contentPadding = isDesktop ? 'xl' : 'lg'
  const verticalPadding = isDesktop ? 'xl' : 'md'
  const columnGap = isDesktop ? 44 : 24
  const hasRightContent = rightContent != null
  const columnTemplate = fullWidth || !hasRightContent ? '1fr' : GOLDEN_RATIO_TEMPLATE

  // Auto-generate breadcrumbs if enabled and no manual override
  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  // Determine which breadcrumbs to display
  const displayBreadcrumbs = breadcrumbItems || breadcrumbs

  // Calculate current index (last item is always active)
  const currentIndex = displayBreadcrumbs.length - 1

  // Guard against undefined/invalid theme (e.g. before ThemeProvider resolves or when theme is 'system')
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const bgColor = colors.bg[resolvedTheme].emphasis

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: bgColor }}
      showsVerticalScrollIndicator={false}
    >
      <Stack gap={20} paddingTop={verticalPadding} paddingBottom={verticalPadding}>
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal={contentPadding}>
            <Breadcrumb items={displayBreadcrumbs} currentIndex={currentIndex} />
          </Row>
        )}

        {/* Header — full-width search/filter toolbar */}
        {headerContent && (
          <Stack paddingHorizontal={contentPadding}>{headerContent}</Stack>
        )}

        {/* Content Area - Two-column golden ratio (lg+) or single column, min 300px per column */}
        <Stack paddingHorizontal={contentPadding}>
          <Grid
            columns={{ base: 1, lg: columnTemplate }}
            gap={columnGap}
            rowGap={isDesktop ? 40 : 28}
          >
            {leftContent ? <Stack>{leftContent}</Stack> : null}
            {rightContent ? <Stack>{rightContent}</Stack> : null}
          </Grid>
        </Stack>
      </Stack>
    </ScrollView>
  )
}
