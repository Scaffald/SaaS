import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import {
  Grid,
  Row,
  Stack,
  Breadcrumb,
  ScreenHeader,
  type BreadcrumbItemData,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useScreenRhythm } from '../../constants/layout'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'
import { useRouteScreenTitle } from '../../hooks/useRouteScreenTitle'
import { useScreenHeaderCollapse } from '../../hooks/useScreenHeaderCollapse'

/** Golden ratio (φ) for column proportion: left ~61.8%, right ~38.2% */
const GOLDEN_RATIO_TEMPLATE = 'minmax(300px, 1.618fr) minmax(300px, 1fr)'

type ProfileLayoutProps = {
  rightContent?: ReactNode
  leftContent: ReactNode
  /** Whether to show breadcrumb navigation (default: true) */
  showBreadcrumb?: boolean
  /** Manual breadcrumb items to override auto-generation */
  breadcrumbItems?: BreadcrumbItemData[]
  /** Whether to auto-generate breadcrumbs from route (default: true) */
  autoGenerateBreadcrumbs?: boolean
  /**
   * The screen's title, rendered as a real heading. Supplied by the route
   * when the caller does not pass one — see `useRouteScreenTitle`.
   */
  screenTitle?: string | null
  /** Uppercase letterspaced line above the title. */
  screenKicker?: string
  /** One sentence on what this screen is for. Collapsible. */
  screenTip?: ReactNode
  /** Page-level primary actions, at header right. */
  screenActions?: ReactNode
  /** Identity for remembering the collapsed state. Defaults to the route. */
  screenKey?: string | null
  /** Opt out of the shared header. */
  hideScreenHeader?: boolean
}

export const ProfileLayout = ({
  rightContent,
  leftContent,
  showBreadcrumb = false,
  breadcrumbItems,
  autoGenerateBreadcrumbs = true,
  screenTitle,
  screenKicker,
  screenTip,
  screenActions,
  screenKey,
  hideScreenHeader = false,
}: ProfileLayoutProps) => {
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const hasRightContent = rightContent != null
  const { gutter: contentPadding, verticalPadding, sectionGap, columnGap, rowGap } =
    useScreenRhythm()

  const routeTitle = useRouteScreenTitle()
  const resolvedTitle = screenTitle !== undefined ? screenTitle : routeTitle.title
  const { collapsed, toggleCollapsed } = useScreenHeaderCollapse(
    hideScreenHeader ? null : (screenKey ?? routeTitle.routeKey),
  )

  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  const displayBreadcrumbs = breadcrumbItems || breadcrumbs
  const currentIndex = displayBreadcrumbs.length - 1
  const bgColor = colors.bg[resolvedTheme].emphasis

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bgColor }} showsVerticalScrollIndicator={false}>
      <Stack gap={sectionGap} paddingTop={verticalPadding} paddingBottom={verticalPadding}>
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal={contentPadding}>
            <Breadcrumb items={displayBreadcrumbs} currentIndex={currentIndex} />
          </Row>
        )}

        {!hideScreenHeader && resolvedTitle ? (
          <Stack paddingHorizontal={contentPadding}>
            <ScreenHeader
              kicker={screenKicker}
              title={resolvedTitle}
              tip={screenTip}
              actions={screenActions}
              collapsed={screenTip ? collapsed : undefined}
              onToggleCollapsed={screenTip ? toggleCollapsed : undefined}
            />
          </Stack>
        ) : null}

        {/* Content Area - Two-column golden ratio (lg+) or single column */}
        <Stack paddingHorizontal={contentPadding}>
          <Grid
            columns={{ base: 1, lg: hasRightContent ? GOLDEN_RATIO_TEMPLATE : '1fr' }}
            gap={columnGap}
            rowGap={rowGap}
          >
            <Stack>{leftContent}</Stack>
            {rightContent ? <Stack>{rightContent}</Stack> : null}
          </Grid>
        </Stack>
      </Stack>
    </ScrollView>
  )
}
