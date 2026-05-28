import type { ReactNode } from 'react'
import { Platform, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Grid, Row, Stack, useThemeContext, useResponsive, useBottomBarContext } from '@scaffald/ui'
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
  const insets = useSafeAreaInsets()
  // The mobile bottom nav floats over content (position: fixed/absolute at
  // bottom: 0). Pad the scroll content so the last item isn't clipped (SC-89).
  // navBarHeight is 0 when the nav isn't mounted (desktop), so this is a no-op there.
  const { navBarHeight } = useBottomBarContext()
  const bottomNavInset = navBarHeight > 0 ? navBarHeight + insets.bottom : 0
  const contentPadding = isDesktop ? 32 : 16
  const verticalPadding = isDesktop ? 32 : 16
  const columnGap = isDesktop ? 32 : 16
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

  // Web: radial gradient for depth behind glass cards. Native: flat warm surface.
  const bgStyle = Platform.OS === 'web'
    ? {
        flex: 1,
        backgroundImage: colors.bg[resolvedTheme].gradient,
      } as Record<string, unknown>
    : { flex: 1, backgroundColor: colors.bg[resolvedTheme].emphasis }

  return (
    <ScrollView
      style={bgStyle}
      showsVerticalScrollIndicator={false}
    >
      <Stack gap={20} paddingTop={verticalPadding} paddingBottom={verticalPadding + bottomNavInset}>
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
