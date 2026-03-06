import { MagicLinkPending } from '@scf/core/features/auth/components/MagicLinkPending'
import { ROUTES } from '@scf/core/constants/routes'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  const params = useLocalSearchParams<{ email?: string }>()
  const router = useRouter()
  const email = typeof params.email === 'string' ? params.email : undefined

  useEffect(() => {
    if (!email?.trim()) {
      router.replace(ROUTES.AUTH.LOGIN.path)
    }
  }, [email, router])

  if (!email?.trim()) {
    return null
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: 'Verify email',
          headerShown: false,
        }}
      />
      <MagicLinkPending email={email} />
    </SafeAreaView>
  )
}
