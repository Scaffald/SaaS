import type { ReactNode } from 'react'
import { ScrollView, XStack, YStack } from 'tamagui'

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
    <ScrollView flex={1} bg="$color3" showsVerticalScrollIndicator={false}>
      <YStack gap="$3" pt="$3" pb="$5">
        {showTabs && <AssessmentsTabs mx="$7" mt="$3" />}

        <XStack
          gap="$3"
          px="$3"
          pt="$3"
          flexDirection="column"
          $md={{
            gap: '$8',
            px: '$7',
            pt: '$3',
            flexDirection: 'row',
          }}
        >
          {hasLeftContent && (
            <YStack
              width="100%"
              $md={{
                flex: hasBothColumns ? 3 : 1,
                minW: hasBothColumns ? 300 : undefined,
              }}
            >
              {leftContent}
            </YStack>
          )}
          {hasRightContent && (
            <YStack
              width="100%"
              $md={{
                flex: hasBothColumns ? 2 : 1,
                minW: hasBothColumns ? 300 : undefined,
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
