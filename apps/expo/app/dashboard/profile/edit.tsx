import { EditProfileScreen } from '@app/core/features/profile/edit-screen'
import { ScreenWrapper } from '@app/ui'
import { router, Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Profile',
          headerBackVisible: false, // Hide default back button since we use floating back button
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <ScreenWrapper
          backButtonProps={{
            onPress: () => router.back(),
          }}
        >
          <EditProfileScreen />
        </ScreenWrapper>
      </SafeAreaView>
    </>
  )
}
