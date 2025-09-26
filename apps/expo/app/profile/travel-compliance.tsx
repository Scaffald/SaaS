import { ProfileTravelComplianceScreen } from '@app/core/features/profile/travel-compliance-screen'
import { ProfileLayout } from '@app/core/features/profile/layout-refactored.native'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Travel & Compliance',
          headerShown: false, // We'll use our custom header
        }}
      />
      <ProfileLayout title="Travel & Compliance">
        <ProfileTravelComplianceScreen />
      </ProfileLayout>
    </>
  )
}
