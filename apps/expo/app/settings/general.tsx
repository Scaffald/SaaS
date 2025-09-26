import { GeneralSettingsScreen } from '@app/core/features/settings/general-screen'
import { ScreenWrapper } from '@app/ui'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'General',
          headerShown: false,
        }}
      />
      <ScreenWrapper>
        <GeneralSettingsScreen />
      </ScreenWrapper>
    </SafeAreaView>
  )
}
