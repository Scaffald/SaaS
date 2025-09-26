import { GeneralSettingsScreen } from '@app/core/features/settings/general-screen'
import { ScreenWrapper } from '@app/ui'
import { router, Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'General',
          headerShown: true,
          headerBackVisible: false, // Hide default back button since we use floating back button
        }}
      />
      <ScreenWrapper
        backButtonProps={{
          onPress: () => router.back(),
        }}
      >
        <GeneralSettingsScreen />
      </ScreenWrapper>
    </SafeAreaView>
  )
}
