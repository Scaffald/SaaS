import type { ReactNode } from 'react'
import { XStack, YStack } from '@unicornlove/ui'
import { WelcomeScreen } from './welcome-screen'

export type AuthLayoutProps = {
  children?: ReactNode
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <XStack flex={1}>
      <YStack flex={2} flexBasis={0} justifyContent="center">
        <YStack paddingHorizontal="$4">{children}</YStack>
      </YStack>

      <YStack $md={{ display: 'none' }} flex={3} flexBasis={0}>
        <WelcomeScreen />
      </YStack>
    </XStack>
  )
}
