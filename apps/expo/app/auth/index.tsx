import { LoginScreen } from '@app/core/features/auth/login-screen'
import { WelcomeScreen } from '@app/core/features/auth/welcome-screen'
import { XStack, YStack } from '@app/ui'
import { Stack } from 'expo-router'
import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const { width } = useWindowDimensions()

  // Use 640px breakpoint (Tamagui's sm breakpoint)
  // Screens smaller than 640px are considered small
  const isSmallScreen = width < 640

  // On small screens (<640px): show WelcomeScreen first, then LoginScreen after onboarding
  // On larger screens (>=640px): show side-by-side layout
  if (isSmallScreen && !hasOnboarded) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <Stack.Screen
          options={{
            title: 'Welcome',
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
          title: 'Sign In',
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
