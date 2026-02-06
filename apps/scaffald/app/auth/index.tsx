import { LoginScreen } from '@scf/core/features/auth/login-screen'
import { WelcomeScreen } from '@scf/core/features/auth/welcome-screen'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { Button, Row, Stack, useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { Stack as RouterStack } from 'expo-router'
import { useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function AuthHeaderThemeToggle() {
  const { theme, toggleTheme } = useThemeContext()
  return (
    <Button
      variant="outlined"
      size="sm"
      onPress={toggleTheme}
      color="gray"
    >
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
