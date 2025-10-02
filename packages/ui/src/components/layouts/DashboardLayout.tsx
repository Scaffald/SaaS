import { ReactNode } from 'react'
import { YStack, XStack, View, ScrollView, useMedia, useWindowDimensions } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'

type DashboardLayoutProps = {
  rightContent?: ReactNode
  leftContent?: ReactNode
}

export const DashboardLayout = ({ rightContent, leftContent }: DashboardLayoutProps) => {
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640

  return (
    <ScrollView flex={1} bg="$color2" pt="$3" pb="$5" showsVerticalScrollIndicator={false}>
      <XStack
        gap={isSmallScreen ? '$3' : '$8'}
        flexDirection={isSmallScreen ? 'column' : 'row'}
        p={isSmallScreen ? '$3' : '$7'}
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
