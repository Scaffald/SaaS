import { SuccessView } from '@app/core/features/auth/components/SuccessView'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from '@app/core/utils/useTranslation'

export default function Screen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: t('auth.success.title'),
          headerShown: true,
        }}
      />
      <SuccessView isVisible={true} />
    </SafeAreaView>
  )
}
