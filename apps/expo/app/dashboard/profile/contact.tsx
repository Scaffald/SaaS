import { ProfileContactAvailabilityScreen } from '@app/core/features/profile/contact-availability-screen'
import { ProfileLayout } from '@app/core/features/profile/layout-refactored.native'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Contact & Availability',
          headerShown: true,
        }}
      />
      <ProfileLayout title="Contact & Availability">
        <ProfileContactAvailabilityScreen />
      </ProfileLayout>
    </>
  )
}
