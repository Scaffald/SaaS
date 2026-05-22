import { BackgroundCheckWizard } from '@scf/core/features/background-check'
import { Stack as ExpoStack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from '@scaffald/ui'

export default function BackgroundCheckInitiateScreen() {
  return (
    <>
      <ExpoStack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <Stack>
          <BackgroundCheckWizard />
        </Stack>
      </SafeAreaView>
    </>
  )
}
