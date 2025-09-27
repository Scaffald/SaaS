import { ProfileWorkSkillsScreen } from '@app/core/features/profile/work-skills-screen'
import { ProfileLayout } from '@app/core/features/profile/layout-refactored.native'
import { Stack } from 'expo-router'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Work & Skills',
          headerShown: true,
        }}
      />
      <ProfileLayout title="Work & Skills">
        <ProfileWorkSkillsScreen />
      </ProfileLayout>
    </>
  )
}
