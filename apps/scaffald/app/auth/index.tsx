import { LoginScreen } from '@scf/core/features/auth/login-screen'
import { WelcomeScreen } from '@scf/core/features/auth/welcome-screen'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { Button, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Stack as RouterStack } from 'expo-router'
import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function AuthHeaderThemeToggle() {
  const { theme, toggleTheme } = useThemeContext()
  return (
    <Button variant="outline" size="sm" onPress={toggleTheme} color="gray">
      {theme === 'light' ? 'Dark' : 'Light'}
    </Button>
  )
}

export default function Screen() {
  const [hasOnboarded, setHasOnboarded] = useState(false)
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640
  const { t } = useTranslation()
  const { theme } = useThemeContext()
  const screenBg = { flex: 1, backgroundColor: colors.bg[theme].default }

  if (isSmallScreen && !hasOnboarded) {
    return (
      <SafeAreaView style={screenBg} edges={['bottom', 'left', 'right']}>
        <RouterStack.Screen
          options={{
            title: t('auth.welcome.title'),
            headerRight: () => <AuthHeaderThemeToggle />,
          }}
        />
        <WelcomeScreen onOnboarded={() => setHasOnboarded(true)} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={screenBg} edges={['bottom', 'left', 'right']}>
      <RouterStack.Screen
        options={{
          title: t('auth.login.title'),
          headerRight: () => <AuthHeaderThemeToggle />,
        }}
      />
      <Row>
        <Stack justify="center">
          <Stack>
            <LoginScreen />
          </Stack>
        </Stack>

        {!isSmallScreen && (
          <Stack>
            <WelcomeScreen />
          </Stack>
        )}
      </Row>
    </SafeAreaView>
  )
}
