import type { ReactNode } from 'react'
import { ScrollView, XStack, YStack } from 'tamagui'
import { ProfileTabs } from '../navigation/ProfileTabs'

type ProfileLayoutProps = {
  rightContent: ReactNode
  leftContent: ReactNode
  /** Whether to show tab navigation (default: true) */
  showTabs?: boolean
}

export const ProfileLayout = ({
  rightContent,
  leftContent,
  showTabs = true,
}: ProfileLayoutProps) => {
  return (
    <ScrollView flex={1} bg="$color4" showsVerticalScrollIndicator={false}>
      <YStack gap="$3" pt="$3" pb="$5">
        {/* Tab Navigation - positioned at top */}
        {showTabs && (
          <XStack pt="$3" $md={{ pt: '$3' }}>
            <ProfileTabs />
          </XStack>
        )}

        {/* Content Area - Responsive two-column layout */}
        <XStack
          gap="$3"
          p="$3"
          flexDirection="column"
          $md={{
            gap: '$8',
            p: '$7',
            flexDirection: 'row',
          }}
        >
          <YStack
            width="100%"
            $md={{
              flex: 3,
              minW: 300,
            }}
          >
            {leftContent}
          </YStack>
          <YStack
            width="100%"
            $md={{
              flex: 2,
              minW: 300,
            }}
          >
            {rightContent}
          </YStack>
        </XStack>
      </YStack>
    </ScrollView>
  )
}
