import { ProfileContactAvailabilityScreen } from '@app/core/features/profile/profile-contact-availability-screen'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Contact & Availability',
          headerShown: true,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <ProfileContactAvailabilityScreen />
      </SafeAreaView>
    </>
  )
}
