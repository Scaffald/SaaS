import { LoginScreen } from '@scf/core/features/auth/login-screen'
import { WelcomeScreen } from '@scf/core/features/auth/welcome-screen'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { Row, Stack } from '@unicornlove/beyond-ui'
import { Stack as RouterStack } from 'expo-router'
import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640
  const { t } = useTranslation()

  if (isSmallScreen && !hasOnboarded) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <RouterStack.Screen
          options={{
            title: t('auth.welcome.title'),
          }}
        />
        <WelcomeScreen onOnboarded={() => setHasOnboarded(true)} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <RouterStack.Screen
        options={{
          title: t('auth.login.title'),
        }}
      />

      <Row flex={1}>
        <Stack flex={2} flexBasis={0} justify="center">
          <Stack paddingHorizontal={16}>
            <LoginScreen />
          </Stack>
        </Stack>

        {!isSmallScreen && (
          <Stack flex={3} flexBasis={0}>
            <WelcomeScreen />
          </Stack>
        )}
      </Row>
    </SafeAreaView>
  )
}
