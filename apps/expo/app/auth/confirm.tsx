import { ConfirmScreen } from '@app/core/features/auth/confirm-screen'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Confirm Email',
        }}
      />
      <ConfirmScreen />
    </SafeAreaView>
  )
}
