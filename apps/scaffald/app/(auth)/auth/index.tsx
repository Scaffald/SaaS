import { IntentBanner } from '@scf/core/features/auth/components/IntentBanner'
import { LoginScreen } from '@scf/core/features/auth/login-screen'
import { WelcomeScreen } from '@scf/core/features/auth/welcome-screen'
import { Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Persisted so returning users (e.g. right after signing out) land on the
// login screen instead of re-watching the 3-slide marketing carousel (#387).
const HAS_SEEN_WELCOME_KEY = '@scaffald:has_seen_welcome'

export default function Screen() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null)
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640
  const { theme } = useThemeContext()
  const screenBg = { flex: 1, backgroundColor: colors.bg[theme].default }

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(HAS_SEEN_WELCOME_KEY)
      .then((v) => {
        if (!cancelled) setHasOnboarded(v === '1')
      })
      .catch(() => {
        if (!cancelled) setHasOnboarded(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const markOnboarded = () => {
    setHasOnboarded(true)
    AsyncStorage.setItem(HAS_SEEN_WELCOME_KEY, '1').catch(() => {})
  }

  // Brief flicker guard while the persisted flag loads.
  if (hasOnboarded === null) {
    return <SafeAreaView style={screenBg} />
  }

  if (isSmallScreen && !hasOnboarded) {
    return <WelcomeScreen onOnboarded={markOnboarded} />
  }

  return (
    <SafeAreaView style={screenBg} edges={['top', 'bottom', 'left', 'right']}>
      <Row flex={1}>
        {!isSmallScreen && (
          <Stack flex={3} style={{ minWidth: 0 }}>
            <WelcomeScreen brandedPanel />
          </Stack>
        )}
        <Stack
          flex={2}
          justify="center"
          align="center"
          padding={24}
          gap={16}
          style={{ minWidth: 0 }}
        >
          <IntentBanner />
          <LoginScreen />
        </Stack>
      </Row>
    </SafeAreaView>
  )
}
