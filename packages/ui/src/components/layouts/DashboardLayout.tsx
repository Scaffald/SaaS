import { ReactNode } from 'react'
import { YStack, XStack, View, Text } from 'tamagui'

export type AppHeaderProps = {
  title?: string
}

type DashboardLayoutProps = {
  children?: ReactNode
  header?: AppHeaderProps | null
  rightContent?: ReactNode
  leftContent?: ReactNode
  leftWidth?: string
  isHomePage?: boolean
}

export const DashboardLayout = ({
  children,
  header,
  rightContent,
  leftContent,
  leftWidth = '300',
  isHomePage,
}: DashboardLayoutProps) => {
  return (
    <YStack flex={1} backgroundColor="$background">
      {header?.title && (
        <XStack padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
          <YStack>
            <Text fontSize="$6" fontWeight="bold">
              {header.title}
            </Text>
          </YStack>
        </XStack>
      )}
      <XStack flex={1}>
        {leftContent && (
          <View width={leftWidth} borderRightWidth={1} borderRightColor="$borderColor">
            {leftContent}
          </View>
        )}
        <View flex={1}>{children}</View>
        {rightContent && (
          <View width={300} borderLeftWidth={1} borderLeftColor="$borderColor">
            {rightContent}
          </View>
        )}
      </XStack>
    </YStack>
  )
}
