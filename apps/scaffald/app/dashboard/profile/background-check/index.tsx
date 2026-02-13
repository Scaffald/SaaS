import { CheckStatusDashboard } from '@scf/core/features/background-check'
import { Stack as ExpoStack } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from '@unicornlove/beyond-ui'

export default function BackgroundCheckDashboardScreen() {
  const insets = useSafeAreaInsets()

  return (
    <>
      <ExpoStack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
        <Stack>
          <CheckStatusDashboard />
        </Stack>
      </SafeAreaView>
    </>
  )
}
