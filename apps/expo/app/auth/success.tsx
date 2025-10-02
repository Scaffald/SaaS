import { SuccessView } from '@app/core/features/auth/components/SuccessView'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Success',
          headerShown: true,
        }}
      />
      <SuccessView isVisible={true} />
    </SafeAreaView>
  )
}
