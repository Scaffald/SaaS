import { EditProfileScreen } from '@app/core/features/profile/edit-screen'
import { ScreenWrapper } from '@app/ui'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Edit Profile',
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScreenWrapper>
          <EditProfileScreen />
        </ScreenWrapper>
      </SafeAreaView>
    </>
  )
}
