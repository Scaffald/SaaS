import { LoginScreen } from '@scf/core/features/auth/login-screen'
import { WelcomeScreen } from '@scf/core/features/auth/welcome-screen'
import { Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useState } from 'react'
import { useWindowDimensions, View, Text, Platform } from 'react-native'
import { Input } from '@scaffald/ui'
import { Mail } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// DEBUG: Test our Input component with minimal props vs full props
function DebugTextInput() {
  const [val1, setVal1] = useState('')
  const [val2, setVal2] = useState('')
  if (Platform.OS !== 'ios') return null
  return (
    <View style={{ padding: 16, backgroundColor: '#fff', gap: 12 }}>
      <Text style={{ fontWeight: 'bold' }}>Test 1: Our Input, no icon</Text>
      <Input
        placeholder="No icon..."
        value={val1}
        onChangeText={setVal1}
        keyboardType="email-address"
      />
      <Text style={{ fontWeight: 'bold' }}>Test 2: Our Input, with Mail icon</Text>
      <Input
        placeholder="With Mail icon..."
        value={val2}
        onChangeText={setVal2}
        keyboardType="email-address"
        iconStart={Mail}
      />
    </View>
  )
}

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
      <DebugTextInput />
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
