import { LoginScreen } from '@app/core/features/auth/login-screen'
import { WelcomeScreen } from '@app/core/features/auth/welcome-screen'
import { useTranslation } from '@app/core/utils/useTranslation'
import { Stack } from 'expo-router'
import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'

export default function Screen() {
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640
  const { t } = useTranslation()

  if (isSmallScreen && !hasOnboarded) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <Stack.Screen
          options={{
            title: t('auth.welcome.title'),
          }}
        />
        <WelcomeScreen onOnboarded={() => setHasOnboarded(true)} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: t('auth.login.title'),
        }}
      />

      <XStack flex={1}>
        <YStack flex={2} flexBasis={0} justify="center">
          <YStack px="$4">
            <LoginScreen />
          </YStack>
        </YStack>

        {!isSmallScreen && (
          <YStack flex={3} flexBasis={0}>
            <WelcomeScreen />
          </YStack>
        )}
      </XStack>
    </SafeAreaView>
  )
}
