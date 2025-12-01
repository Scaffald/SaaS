import { SuccessView } from '@app/core/features/auth/components/SuccessView'
import { useTranslation } from '@app/core/utils/useTranslation'
import { Stack } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  const { t } = useTranslation()

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('auth.success.title'),
        }}
      />
      <SuccessView isVisible={true} />
    </SafeAreaView>
  )
}
