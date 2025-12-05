import { BackgroundCheckWizard } from '@scf/core/features/background-check'
import { Stack } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from '@unicornlove/ui'

export default function BackgroundCheckInitiateScreen() {
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
          <BackgroundCheckWizard />
        </YStack>
      </SafeAreaView>
    </>
  )
}
