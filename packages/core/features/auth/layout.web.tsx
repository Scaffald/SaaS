import { XStack, YStack } from 'tamagui'
import { WelcomeScreen } from './welcome-screen'
import type { ReactNode } from 'react'

export type AuthLayoutProps = {
  children?: ReactNode
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <XStack flex={1}>
      <YStack flex={2} flexBasis={0} justify="center">
        <YStack px="$4">{children}</YStack>
      </YStack>

      <YStack $md={{ display: 'none' }} flex={3} flexBasis={0}>
        <WelcomeScreen />
      </YStack>
    </XStack>
  )
}
