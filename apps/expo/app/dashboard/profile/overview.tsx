import { ProfileOverviewScreen } from '@app/core/features/profile/profile-overview-screen'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile Overview',
          headerShown: true,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <ProfileOverviewScreen />
      </SafeAreaView>
    </>
  )
}
