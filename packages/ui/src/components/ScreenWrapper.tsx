import { ReactNode } from 'react'
import { YStack, YStackProps } from 'tamagui'

export interface ScreenWrapperProps extends YStackProps {
  children: ReactNode
  backButtonProps?: {
    onPress: () => void
  }
}

export const ScreenWrapper = ({ children, backButtonProps, ...props }: ScreenWrapperProps) => {
  return (
    <YStack flex={1} {...props}>
      {children}
    </YStack>
  )
}
