import type { ReactNode } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import { AssessmentsTabs } from '../navigation/AssessmentsTabs'

type AssessmentsLayoutProps = {
  leftContent?: ReactNode
  rightContent?: ReactNode
  showTabs?: boolean
}

export const AssessmentsLayout = ({
  leftContent,
  rightContent,
  showTabs = true,
}: AssessmentsLayoutProps) => {
  const hasLeftContent = Boolean(leftContent)
  const hasRightContent = Boolean(rightContent)
  const _hasBothColumns = hasLeftContent && hasRightContent

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Stack gap={12} paddingTop="sm" paddingBottom="lg">
        {showTabs && (
          <Stack marginHorizontal="$7" marginTop={12}>
            <AssessmentsTabs />
          </Stack>
        )}

        <Row gap={12} paddingHorizontal="sm" paddingTop="sm">
          {hasLeftContent && <Stack width="100%">{leftContent}</Stack>}
          {hasRightContent && <Stack width="100%">{rightContent}</Stack>}
        </Row>
      </Stack>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
})
