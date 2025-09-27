import { ProfileBackgroundScreen } from '@app/core/features/profile/profile-background-screen'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Background',
          headerShown: true,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <ProfileBackgroundScreen />
      </SafeAreaView>
    </>
  )
}
