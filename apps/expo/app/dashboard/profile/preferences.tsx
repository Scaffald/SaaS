import { ProfileTravelComplianceScreen } from '@app/core/features/profile/travel-compliance-screen'
import { ProfileLayout } from '@app/core/features/profile/layout-refactored.native'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Travel & Compliance',
          headerShown: true,
        }}
      />
      <ProfileLayout title="Travel & Compliance">
        <ProfileTravelComplianceScreen />
      </ProfileLayout>
    </>
  )
}
