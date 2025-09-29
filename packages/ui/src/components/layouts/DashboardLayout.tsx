import { ReactNode } from 'react'
import { YStack, XStack, View, Text, H3 } from 'tamagui'

type DashboardLayoutProps = {
  header?: ReactNode
  rightContent?: ReactNode
  leftContent?: ReactNode
  leftWidth?: string
  rightWidth?: string
}

export const DashboardLayout = ({
  header,
  rightContent,
  leftContent,
  leftWidth = '62%',
  rightWidth = '38%',
}: DashboardLayoutProps) => {
  return (
    <YStack flex={1} backgroundColor="$color2" py="$3" flexWrap="wrap">
      {header && <XStack padding="$4">{header}</XStack>}
      <XStack flex={1}>
        {leftContent && (
          <View minWidth="300" $sm={{ width: '100%' }} width={leftWidth}>
            {leftContent}
          </View>
        )}
        {rightContent && (
          <View minWidth="300" $sm={{ width: '100%' }} width={rightWidth}>
            {rightContent}
          </View>
        )}
      </XStack>
    </YStack>
  )
}
