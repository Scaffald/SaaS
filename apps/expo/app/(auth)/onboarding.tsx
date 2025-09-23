import { OnboardingScreen } from '@app/core/features/auth/onboarding-screen'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Onboarding',
        }}
      />
      <OnboardingScreen />
    </>
  )
}
