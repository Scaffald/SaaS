import type { ReactNode } from 'react'
import { ScrollView, XStack, YStack } from '@unicornlove/ui'

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
      <YStack gap="$3" paddingTop="$3" paddingBottom="$5">
        {showTabs && <AssessmentsTabs marginHorizontal="$7" marginTop="$3" />}

        <XStack
          gap="$3"
          paddingHorizontal="$3"
          paddingTop="$3"
          flexDirection="column"
          $md={{
            gap: '$8',
            paddingHorizontal: '$7',
            paddingTop: '$3',
            flexDirection: 'row',
          }}
        >
          {hasLeftContent && (
            <YStack
              width="100%"
              $md={{
                width: hasBothColumns ? undefined : '100%',
                flex: hasBothColumns ? 13 : 1,
                minWidth: hasBothColumns ? 300 : undefined,
              }}
            >
              {leftContent}
            </YStack>
          )}
          {hasRightContent && (
            <YStack
              width="100%"
              $md={{
                width: hasBothColumns ? undefined : '100%',
                flex: hasBothColumns ? 7 : 1,
                minWidth: hasBothColumns ? 300 : undefined,
              }}
            >
              {rightContent}
            </YStack>
          )}
        </XStack>
      </YStack>
    </ScrollView>
  )
}
