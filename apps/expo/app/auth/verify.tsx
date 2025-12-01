import { MagicLinkPending } from '@app/core/features/auth/components/MagicLinkPending'
import { useTranslation } from '@app/core/utils/useTranslation'
import { Stack, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  const params = useLocalSearchParams<{ email?: string }>()
  const { t } = useTranslation()

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('auth.verify.title'),
        }}
      />
      <MagicLinkPending email={params.email} />
    </SafeAreaView>
  )
}
