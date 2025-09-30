import { LoginScreen } from '@app/core/features/auth/login-screen'
import { WelcomeScreen } from '@app/core/features/auth/welcome-screen'
import { XStack, YStack } from '@app/ui'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Sign In',
        }}
      />

      <XStack flex={1}>
        <YStack flex={2} fb={0} justify="center">
          <YStack px="$4">
            <LoginScreen />
          </YStack>
        </YStack>

        <YStack $md={{ dsp: 'none' }} flex={3} fb={0}>
          <WelcomeScreen />
        </YStack>
      </XStack>
    </SafeAreaView>
  )
}
