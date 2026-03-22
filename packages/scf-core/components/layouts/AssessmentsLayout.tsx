import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Grid, Stack, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import { AssessmentsTabs } from '../navigation/AssessmentsTabs'

/** Golden ratio (φ) for column proportion: left ~61.8%, right ~38.2% */
const GOLDEN_RATIO_TEMPLATE = 'minmax(300px, 1.618fr) minmax(300px, 1fr)'

type AssessmentsLayoutProps = {
  leftContent?: ReactNode
  rightContent?: ReactNode
  showTabs?: boolean
}

export const AssessmentsLayout = ({
  leftContent,
  rightContent,
  showTabs = false,
}: AssessmentsLayoutProps) => {
  const { isDesktop } = useResponsive()
  const { theme } = useThemeContext()
  const hasRightContent = rightContent != null
  const contentPadding = isDesktop ? '2xl' : 'lg'
  const columnGap = isDesktop ? 44 : 24
  const bgColor = colors.bg[theme].emphasis

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bgColor }} showsVerticalScrollIndicator={false}>
      <Stack gap={20} paddingTop="sm" paddingBottom="lg">
        {showTabs && (
          <Stack marginHorizontal={28} marginTop={12}>
            <AssessmentsTabs />
          </Stack>
        )}

        {/* Content Area - Two-column golden ratio (lg+) or single column */}
        <Stack paddingHorizontal={contentPadding}>
          <Grid
            columns={{ base: 1, lg: hasRightContent ? GOLDEN_RATIO_TEMPLATE : '1fr' }}
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
