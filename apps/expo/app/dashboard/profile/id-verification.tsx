import { IdVerificationFlow } from '@app/core/features/id-verification'
import { Stack } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'

export default function IdVerificationScreen() {
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
          <IdVerificationFlow />
        </YStack>
      </SafeAreaView>
    </>
  )
}
