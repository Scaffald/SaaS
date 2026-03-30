import { LoginScreen } from '@scf/core/features/auth/login-screen'
import { WelcomeScreen } from '@scf/core/features/auth/welcome-screen'
import { Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Screen() {
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640
  const { theme } = useThemeContext()
  const screenBg = { flex: 1, backgroundColor: colors.bg[theme].default }

  if (isSmallScreen && !hasOnboarded) {
    return (
      <SafeAreaView style={screenBg} edges={['top', 'bottom', 'left', 'right']}>
        <WelcomeScreen onOnboarded={() => setHasOnboarded(true)} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={screenBg} edges={['top', 'bottom', 'left', 'right']}>
      <Row flex={1}>
        {!isSmallScreen && (
          <Stack flex={3} style={{ minWidth: 0 }}>
            <WelcomeScreen brandedPanel />
          </Stack>
        )}
        <Stack flex={2} justify="center" align="center" padding={24} style={{ minWidth: 0 }}>
          <LoginScreen />
        </Stack>
      </Row>
    </SafeAreaView>
  )
}
