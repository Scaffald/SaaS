import { ReactNode } from 'react'
import { YStack, XStack, View, ScrollView, useMedia } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'

type DashboardLayoutProps = {
  rightContent?: ReactNode
  leftContent?: ReactNode
}

export const DashboardLayout = ({ rightContent, leftContent }: DashboardLayoutProps) => {
  return (
    <ScrollView flex={1} bg="$color2" pt="$3" pb="$5" showsVerticalScrollIndicator={false}>
      <XStack
        height="100vh"
        gap="$3"
        flexDirection="column"
        p="$3"
        $md={{ flexDirection: 'row', gap: '$8', p: '$7' }}
      >
        {leftContent && (
          <YStack minW={300} flex={2}>
            {leftContent}
          </YStack>
        )}
        {rightContent && (
          <YStack minW={300} flex={1}>
            {rightContent}
          </YStack>
        )}
      </XStack>
    </ScrollView>
  )
}
