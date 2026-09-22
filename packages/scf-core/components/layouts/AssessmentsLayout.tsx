import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Grid, ScreenHeader, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import { AssessmentsTabs } from '../navigation/AssessmentsTabs'
import { useScreenRhythm } from '../../constants/layout'
import { useRouteScreenTitle } from '../../hooks/useRouteScreenTitle'
import { useScreenHeaderCollapse } from '../../hooks/useScreenHeaderCollapse'

/** Golden ratio (φ) for column proportion: left ~61.8%, right ~38.2% */
const GOLDEN_RATIO_TEMPLATE = 'minmax(300px, 1.618fr) minmax(300px, 1fr)'

type AssessmentsLayoutProps = {
  leftContent?: ReactNode
  rightContent?: ReactNode
  showTabs?: boolean
  /** The screen's title. Taken from the route when not supplied. */
  screenTitle?: string | null
  /** Uppercase letterspaced line above the title. */
  screenKicker?: string
  /** One sentence on what this screen is for. Collapsible. */
  screenTip?: ReactNode
  /** Page-level primary actions, at header right. */
  screenActions?: ReactNode
  /** Opt out of the shared header. */
  hideScreenHeader?: boolean
}

export const AssessmentsLayout = ({
  leftContent,
  rightContent,
  showTabs = false,
  screenTitle,
  screenKicker,
  screenTip,
  screenActions,
  hideScreenHeader = false,
}: AssessmentsLayoutProps) => {
  const { theme } = useThemeContext()
  const hasRightContent = rightContent != null
  const { gutter: contentPadding, verticalPadding, sectionGap, columnGap, rowGap } =
    useScreenRhythm()
  const bgColor = colors.bg[theme].emphasis
  const routeTitle = useRouteScreenTitle()
  const resolvedTitle = screenTitle !== undefined ? screenTitle : routeTitle.title
  const { collapsed, toggleCollapsed } = useScreenHeaderCollapse(
    hideScreenHeader ? null : routeTitle.routeKey,
  )

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bgColor }} showsVerticalScrollIndicator={false}>
      <Stack gap={sectionGap} paddingTop={verticalPadding} paddingBottom={verticalPadding}>
        {showTabs && (
          <Stack marginHorizontal={contentPadding} marginTop={0}>
            <AssessmentsTabs />
          </Stack>
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
            {leftContent ? <Stack>{leftContent}</Stack> : null}
            {rightContent ? <Stack>{rightContent}</Stack> : null}
          </Grid>
        </Stack>
      </Stack>
    </ScrollView>
  )
}
