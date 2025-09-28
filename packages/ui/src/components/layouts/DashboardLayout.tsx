import { ReactNode } from 'react'
import { YStack, XStack, View, Text, H3 } from 'tamagui'

type HeaderConfig = {
  title?: string
  subtitle?: string
}

type DashboardLayoutProps = {
  header?: ReactNode | HeaderConfig
  rightContent?: ReactNode
  leftContent?: ReactNode
  leftWidth?: string
  rightWidth?: string
}

export const DashboardLayout = ({
  header,
  rightContent,
  leftContent,
  leftWidth = '70%',
  rightWidth = '30%',
}: DashboardLayoutProps) => {
  const renderHeader = () => {
    if (!header) return null

    // If header is an object with title/subtitle, render it as a proper header
    if (typeof header === 'object' && header !== null && 'title' in header) {
      const headerConfig = header as HeaderConfig
      return (
        <XStack padding="$4" alignItems="center">
          <YStack space="$1">
            {headerConfig.title && <H3>{headerConfig.title}</H3>}
            {headerConfig.subtitle && (
              <Text color="$gray11" fontSize="$3">
                {headerConfig.subtitle}
              </Text>
            )}
          </YStack>
        </XStack>
      )
    }

    // If header is already a ReactNode, render it directly
    return <XStack padding="$4">{header}</XStack>
  }

  return (
    <YStack flex={1} backgroundColor="$color2" p="0" flexWrap="wrap">
      {renderHeader()}
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
