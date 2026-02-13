import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { Row, Stack } from '@unicornlove/beyond-ui'

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
  const hasBothColumns = hasLeftContent && hasRightContent

  return (
    <ScrollView flex={1} backgroundColor="$color3" showsVerticalScrollIndicator={false}>
      <Stack gap={12} paddingTop={12} paddingBottom={20}>
        {showTabs && <AssessmentsTabs marginHorizontal="$7" marginTop={12} />}

        <Row
          gap={12}
          paddingHorizontal={12}
          paddingTop={12}
          flexDirection="column"
        >
          {hasLeftContent && (
            <Stack
              width="100%"
            >
              {leftContent}
            </Stack>
          )}
          {hasRightContent && (
            <Stack
              width="100%"
            >
              {rightContent}
            </Stack>
          )}
        </Row>
      </Stack>
    </ScrollView>
  )
}
