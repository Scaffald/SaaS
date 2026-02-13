import { MagicLinkPending } from '@scf/core/features/auth/components/MagicLinkPending'
import { Stack, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  const params = useLocalSearchParams<{ email?: string }>()

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen />
      <MagicLinkPending email={params.email} />
    </SafeAreaView>
  )
}
