import { ReactNode } from 'react'
import { YStack, XStack, View, Text, H3 } from 'tamagui'

type DashboardLayoutProps = {
  header?: ReactNode
  rightContent?: ReactNode
  leftContent?: ReactNode
  leftWidth?: number
  rightWidth?: number
}

export const DashboardLayout = ({
  header,
  rightContent,
  leftContent,
  leftWidth = 2,
  rightWidth = 1,
}: DashboardLayoutProps) => {
  return (
    <YStack flex={1} bg="$color2" py="$3" flexWrap="wrap">
      {header && <XStack p="$4">{header}</XStack>}
      <XStack flex={1}>
        {leftContent && (
          <YStack minW={300} $sm={{ flex: 1 }} flex={leftWidth}>
            {leftContent}
          </YStack>
        )}
        {rightContent && (
          <YStack minW={300} $sm={{ flex: 1 }} flex={rightWidth}>
            {rightContent}
          </YStack>
        )}
      </XStack>
    </YStack>
  )
}
