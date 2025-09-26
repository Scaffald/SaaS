import { ProfileOverviewScreen } from '@app/core/features/profile/overview-screen'
import { ProfileLayout } from '@app/core/features/profile/layout-refactored.native'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile Overview',
          headerShown: false, // We'll use our custom header
        }}
      />
      <ProfileLayout title="Profile Overview" isProfileHome={true}>
        <ProfileOverviewScreen />
      </ProfileLayout>
    </>
  )
}
