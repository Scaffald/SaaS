import { ProfileGeneralScreen } from '@app/core/features/profile/profile-general-screen'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'General Information',
          headerShown: true,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <ProfileGeneralScreen />
      </SafeAreaView>
    </>
  )
}
