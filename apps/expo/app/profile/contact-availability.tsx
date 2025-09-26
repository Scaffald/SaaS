import { ProfileContactAvailabilityScreen } from '@app/core/features/profile/contact-availability-screen'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Contact & Availability',
          headerShown: true,
        }}
      />
      <ProfileContactAvailabilityScreen />
    </SafeAreaView>
  )
}
