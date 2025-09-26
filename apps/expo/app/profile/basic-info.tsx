import { ProfileBasicInfoScreen } from '@app/core/features/profile/basic-info-screen'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Basic Information',
          headerShown: true,
        }}
      />
      <ProfileBasicInfoScreen />
    </SafeAreaView>
  )
}
