import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { YStack, H2, Paragraph } from '@app/ui'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Profile Overview',
          headerShown: true,
        }}
      />
      <YStack f={1} p="$4" gap="$4">
        <H2>Profile Overview</H2>
        <Paragraph>Profile overview content will go here.</Paragraph>
      </YStack>
    </SafeAreaView>
  )
}
