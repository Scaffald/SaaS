import { WelcomeScreen } from '@app/core/features/auth/welcome-screen'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Welcome',
        }}
      />
      <WelcomeScreen />
    </>
  )
}
