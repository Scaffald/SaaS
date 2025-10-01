import { MagicLinkPending } from '@app/core/features/auth/components/MagicLinkPending'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  const params = useLocalSearchParams<{ email?: string }>()
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Verify Email',
          headerShown: true,
        }}
      />
      <MagicLinkPending email={params.email} onBack={() => router.back()} />
    </SafeAreaView>
  )
}
