import { ProfileBasicInfoScreen } from '@app/core/features/profile/basic-info-screen'
import { ProfileLayout } from '@app/core/features/profile/layout-refactored.native'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Basic Information',
          headerShown: true,
          headerBackVisible: false, // Hide default back button since we use floating back button
        }}
      />
      <ProfileLayout title="Basic Information">
        <ProfileBasicInfoScreen />
      </ProfileLayout>
    </>
  )
}
