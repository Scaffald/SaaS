import { MagicLinkPending } from '@app/core/features/auth/components/MagicLinkPending'
import { Stack, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from '@app/core/utils/useTranslation'

export default function Screen() {
  const params = useLocalSearchParams<{ email?: string }>()
  const { t } = useTranslation()

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: t('auth.verify.title'),
          headerShown: true,
        }}
      />
      <MagicLinkPending email={params.email} />
    </SafeAreaView>
  )
}
