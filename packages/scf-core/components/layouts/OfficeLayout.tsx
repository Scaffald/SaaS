import { GroupTabs } from '@scf/core/features/drawer/GroupTabs'
import { officeGroupPages } from '@scf/core/features/office/office-groups'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { ScrollView, StyleSheet } from 'react-native'
import { usePathname } from '@scf/core/utils/usePathname'
import type { ReactNode } from 'react'
import { Grid, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { StackProps } from '@scaffald/ui'
import { Breadcrumb, type BreadcrumbItemData } from '@scaffald/ui'

/** Golden ratio (φ) for column proportion: left ~61.8%, right ~38.2% */
const GOLDEN_RATIO_TEMPLATE = 'minmax(300px, 1.618fr) minmax(300px, 1fr)'
import { useScreenRhythm } from '../../constants/layout'
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs'

type OfficeLayoutProps = {
  rightContent?: ReactNode
  leftContent?: ReactNode
  /** Whether to show breadcrumb navigation (default: true) */
  showBreadcrumb?: boolean
  /** Manual breadcrumb items to override auto-generation */
  breadcrumbItems?: BreadcrumbItemData[]
  /** Whether to auto-generate breadcrumbs from route (default: true) */
  autoGenerateBreadcrumbs?: boolean
  /** Optional props for the main content wrapper */
  contentProps?: StackProps
  /** Optional props for the left column wrapper */
  leftContainerProps?: StackProps
  /** Optional props for the right column wrapper */
  rightContainerProps?: StackProps
}

/**
 * OfficeLayout component for Office section pages
 *
 * A thin wrapper around DashboardLayout with Office-specific defaults.
 * Provides consistent two-column layout with breadcrumbs for all Office pages.
 *
 * @example
 * ```tsx
 * <OfficeLayout
 *   leftContent={<OfficePageLayout ... />}
 *   rightContent={<Summary ... />}
 * />
 * ```
 */
export const OfficeLayout = ({
  rightContent,
  leftContent,
  showBreadcrumb = false,
  breadcrumbItems,
  autoGenerateBreadcrumbs = true,
  contentProps,
  leftContainerProps,
  rightContainerProps,
}: OfficeLayoutProps) => {
  const pathname = usePathname()
  const currentPath = pathname ?? ''
  // `useResponsive`, not `useWindowDimensions`: one shared subscription rather
  // than a listener per component (.radium/scaffald-ui.md), and the same
  // breakpoint as every other layout — Office used to collapse to one column
  // at 800px while the rest of the app did so somewhere else.
  const {
    gutter: contentPadding,
    verticalPadding,
    sectionGap,
    columnGap,
    rowGap,
  } = useScreenRhythm()
  const { theme } = useThemeContext()

  // Auto-generate breadcrumbs if enabled and no manual override
  const { breadcrumbs } = useBreadcrumbs({
    autoGenerate: autoGenerateBreadcrumbs && !breadcrumbItems,
    customItems: breadcrumbItems,
  })

  // Determine which breadcrumbs to display
  const displayBreadcrumbs = breadcrumbItems || breadcrumbs

  // Calculate current index (last item is always active)
  const currentIndex = displayBreadcrumbs.length - 1

  // The row of the Office tab's own pages (#1441): Organizations' Teams,
  // Projects and Universities, Screening's queues. It used to be built from
  // the route tree with tabs that did not navigate.
  const { hasRole } = useUserRoles()
  const group = officeGroupPages(currentPath, {
    isCheckAdmin: hasRole('background_check_admin'),
  })

  const hasLeftContent = Boolean(leftContent)
  const hasRightContent = Boolean(rightContent)

  return (
    <ScrollView
      // The office ground was `colors.gray[50]`, a light-only literal in a
      // module-level sheet — the one piece of this screen that could never go
      // dark (#970).
      style={[styles.scroll, { backgroundColor: colors.bg[theme].subtle }]}
      showsVerticalScrollIndicator={false}
    >
      <Stack gap={sectionGap} paddingTop={verticalPadding} paddingBottom={verticalPadding}>
        {/* Breadcrumb - positioned at top */}
        {showBreadcrumb && displayBreadcrumbs.length > 0 && (
          <Row paddingHorizontal={contentPadding}>
            <Breadcrumb items={displayBreadcrumbs} currentIndex={currentIndex} />
          </Row>
        )}

        {/* The Office tab's pages. One scrolling strip: below Tabs' wrap
            breakpoint the ATS tabs wrapped over three rows at 390 (#1032). */}
        {group && (
          <Row paddingHorizontal={contentPadding}>
            <GroupTabs group={group} />
          </Row>
        )}

        {/* Content Area - Two-column golden ratio (lg+) or single column */}
        <Stack paddingHorizontal={contentPadding}>
          <Grid
            columns={{ base: 1, lg: hasRightContent ? GOLDEN_RATIO_TEMPLATE : '1fr' }}
            gap={columnGap}
            rowGap={rowGap}
          >
            {hasLeftContent ? (
              <Stack {...(contentProps ?? {})} {...(leftContainerProps ?? {})}>
                {leftContent}
              </Stack>
            ) : null}
            {hasRightContent ? (
              <Stack {...(contentProps ?? {})} {...(rightContainerProps ?? {})}>
                {rightContent}
              </Stack>
            ) : null}
          </Grid>
        </Stack>
      </Stack>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
})
