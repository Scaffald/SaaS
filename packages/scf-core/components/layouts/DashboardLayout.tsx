import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Grid, Row, Stack, useThemeContext, useBottomBarContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  Breadcrumb,
  ScreenHeader,
  type BreadcrumbItemData,
  type ScreenHeaderBack,
} from '@scaffald/ui'
import { CONTENT_WIDTH, useScreenRhythm } from '../../constants/layout'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'
import { useScreenHeaderCollapse } from '../../hooks/useScreenHeaderCollapse'

/** Golden ratio (φ) for column proportion: left ~61.8%, right ~38.2% */
const GOLDEN_RATIO_TEMPLATE = 'minmax(300px, 1.618fr) minmax(300px, 1fr)'

type DashboardLayoutProps = {
  rightContent?: ReactNode
  leftContent?: ReactNode
  /** Full-width header rendered above the grid (search bars, filter toolbars, etc.) */
  headerContent?: ReactNode
  /**
   * The screen's title, rendered as a real heading in a `ScreenHeader` above
   * the toolbar. `DashboardPage` fills this from the route when a screen does
   * not pass one, so every screen gets a heading rather than only the ones
   * that remembered to draw their own.
   */
  screenTitle?: string | null
  /** Uppercase letterspaced line above the title — the context, not the name. */
  screenKicker?: string
  /** One sentence on what this screen is for. Collapsible; see `screenKey`. */
  screenTip?: ReactNode
  /** Page-level primary actions. They live at header right, always. */
  screenActions?: ReactNode
  /**
   * Identity for remembering the collapsed state of the tip. Defaults to the
   * route path in `DashboardPage`. Every screen opens expanded on first
   * visit; collapse is a choice the screen remembers.
   */
  screenKey?: string | null
  /** Opt a screen out of the shared header (it draws its own, or wants none). */
  hideScreenHeader?: boolean
  /**
   * Whether to show the breadcrumb trail. Off by default: the prototype has
   * no breadcrumbs — top-level screens are placed by the nav and their tabs,
   * and a drill-in gets one named back link instead (`back`, #1163).
   */
  showBreadcrumb?: boolean
  /** "← Parent" above the screen header, for a drill-in. */
  back?: ScreenHeaderBack
  /**
   * Narrow, centred reading column (~760px) for screens of prose and single
   * lists — notifications, settings. Everything else gets the working width.
   */
  readingWidth?: boolean
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
  showBreadcrumb = false,
  back,
  readingWidth = false,
  breadcrumbItems,
  autoGenerateBreadcrumbs = true,
  fullWidth = false,
  screenTitle,
  screenKicker,
  screenTip,
  screenActions,
  screenKey,
  hideScreenHeader = false,
}: DashboardLayoutProps) => {
  const { theme } = useThemeContext()
  const insets = useSafeAreaInsets()
  // The mobile bottom nav floats over content (position: fixed/absolute at
  // bottom: 0). Pad the scroll content so the last item isn't clipped (SC-89).
  // navBarHeight is 0 when the nav isn't mounted (desktop), so this is a no-op there.
  const { navBarHeight } = useBottomBarContext()
  const { collapsed, toggleCollapsed } = useScreenHeaderCollapse(
    hideScreenHeader ? null : (screenKey ?? null)
  )
  const bottomNavInset = navBarHeight > 0 ? navBarHeight + insets.bottom : 0
  const {
    gutter: contentPadding,
    verticalPadding,
    sectionGap,
    columnGap,
    rowGap,
  } = useScreenRhythm()
  const hasRightContent = rightContent != null
  const columnTemplate = fullWidth || !hasRightContent ? '1fr' : GOLDEN_RATIO_TEMPLATE

  // Auto-generate breadcrumbs if enabled and no manual override
  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: showBreadcrumb && autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  // Determine which breadcrumbs to display
  const displayBreadcrumbs = breadcrumbItems || breadcrumbs

  // Calculate current index (last item is always active)
  const currentIndex = displayBreadcrumbs.length - 1

  // Guard against undefined/invalid theme (e.g. before ThemeProvider resolves or when theme is 'system')
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'

  // One flat ground, the same in every layout. Web painted a radial gradient
  // here "for depth behind glass cards" — the glass cards are gone, and the
  // gradient made every DashboardLayout screen a mottled beige beside Office's
  // flat canvas, so moving between sections changed the background (#1159).
  const bgStyle = { flex: 1, backgroundColor: colors.bg[resolvedTheme].subtle }
  // A centred column instead of content running the full canvas: at 1440 a
  // notification's title sat ~1000px from its timestamp (#1160).
  const column = {
    width: '100%' as const,
    maxWidth: (readingWidth ? CONTENT_WIDTH.reading : CONTENT_WIDTH.working) + contentPadding * 2,
    alignSelf: 'center' as const,
  }

  return (
    <ScrollView style={bgStyle} showsVerticalScrollIndicator={false}>
      <Stack
        gap={sectionGap}
        paddingTop={verticalPadding}
        paddingBottom={verticalPadding + bottomNavInset}
        style={column}
      >
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal={contentPadding}>
            <Breadcrumb items={displayBreadcrumbs} currentIndex={currentIndex} />
          </Row>
        )}

        {/* Screen header — kicker, title, tip, actions. Above the toolbar,
            because the toolbar acts on what the title names. */}
        {!hideScreenHeader && screenTitle ? (
          <Stack paddingHorizontal={contentPadding}>
            <ScreenHeader
              back={back}
              kicker={screenKicker}
              title={screenTitle}
              tip={screenTip}
              actions={screenActions}
              collapsed={screenTip ? collapsed : undefined}
              onToggleCollapsed={screenTip ? toggleCollapsed : undefined}
            />
          </Stack>
        ) : null}

        {/* Header — full-width search/filter toolbar */}
        {headerContent && <Stack paddingHorizontal={contentPadding}>{headerContent}</Stack>}

        {/* Content Area - Two-column golden ratio (lg+) or single column, min 300px per column */}
        <Stack paddingHorizontal={contentPadding}>
          <Grid columns={{ base: 1, lg: columnTemplate }} gap={columnGap} rowGap={rowGap}>
            {leftContent ? <Stack>{leftContent}</Stack> : null}
            {rightContent ? <Stack>{rightContent}</Stack> : null}
          </Grid>
        </Stack>
      </Stack>
    </ScrollView>
  )
}
