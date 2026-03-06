import { supportedLocales, type SupportedLocale } from '@scf/core/locales'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Moon, Sun } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
}

function cycleLocale(current: SupportedLocale): SupportedLocale {
  const index = supportedLocales.indexOf(current)
  const next = (index + 1) % supportedLocales.length
  return supportedLocales[next] ?? 'en'
}

export function FloatingThemeToggle() {
  const { theme, toggleTheme } = useThemeContext()
  return (
    <Pressable
      onPress={toggleTheme}
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 100,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bg[theme].subtle,
        borderWidth: 1,
        borderColor: colors.border[theme].default,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      {theme === 'light' ? (
        <Moon size={18} color={colors.text[theme].secondary} />
      ) : (
        <Sun size={18} color={colors.text[theme].secondary} />
      )}
    </Pressable>
  )
}

export function FloatingLocaleToggle() {
  const { theme } = useThemeContext()
  const { locale, setLocale } = useTranslation()
  const nextLocale = cycleLocale(locale)

  return (
    <Pressable
      onPress={() => setLocale(nextLocale)}
      style={{
        position: 'absolute',
        top: 16,
        right: 64,
        zIndex: 100,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.bg[theme].subtle,
        borderWidth: 1,
        borderColor: colors.border[theme].default,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel={`Language: ${LOCALE_LABELS[locale]}. Switch to ${LOCALE_LABELS[nextLocale]}.`}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: colors.text[theme].secondary,
        }}
      >
        {LOCALE_LABELS[locale]}
      </Text>
    </Pressable>
  )
}

export function AuthFloatingToggles() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, pointerEvents: 'box-none' }}>
      <FloatingLocaleToggle />
      <FloatingThemeToggle />
    </View>
  )
}

/** Default export for Expo Router (file is under app/auth; prevents "missing default export" warning). */
export default function FloatingTogglesRoute() {
  return null
}
