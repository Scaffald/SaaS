import { EditProfileForm } from '@app/core/features/profile/components/EditProfileForm'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Profile',
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <EditProfileForm />
      </SafeAreaView>
    </>
  )
}
