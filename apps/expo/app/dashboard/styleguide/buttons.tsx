import { StyleguideLayout, ButtonsScreen } from '@app/core/features/styleguide'
import { ScreenWrapper } from '@app/ui'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <ScreenWrapper
        backButtonProps={{
          onPress: () => router.back(),
        }}
      >
        <StyleguideLayout>
          <ButtonsScreen />
        </StyleguideLayout>
      </ScreenWrapper>
    </SafeAreaView>
  )
}
