import { Stack } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'

import { CheckStatusDashboard } from '@app/core/features/background-check'

export default function BackgroundCheckDashboardScreen() {
  const insets = useSafeAreaInsets()

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
        <YStack flex={1}>
          <CheckStatusDashboard />
        </YStack>
      </SafeAreaView>
    </>
  )
}
