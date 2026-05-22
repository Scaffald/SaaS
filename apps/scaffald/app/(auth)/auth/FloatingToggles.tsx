import { supportedLocales, type SupportedLocale } from '@scf/core/locales'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
// SC-28: Theme toggle hidden for MVP (light-only). Restore the import and
// <ThemeToggleButton /> render below once dark mode is reinstated.
// import { Moon, Sun } from 'lucide-react-native'
import { Platform, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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

// SC-28: ThemeToggleButton hidden for MVP (light-only).
// function ThemeToggleButton() {
//   const { theme, toggleTheme } = useThemeContext()
//   return (
//     <Pressable
//       onPress={toggleTheme}
//       style={{
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         backgroundColor: colors.bg[theme].subtle,
//         borderWidth: 1,
//         borderColor: colors.border[theme].default,
//         alignItems: 'center',
//         justifyContent: 'center',
//       }}
//       accessibilityLabel={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
//     >
//       {theme === 'light' ? (
//         <Moon size={18} color={colors.text[theme].secondary} />
//       ) : (
//         <Sun size={18} color={colors.text[theme].secondary} />
//       )}
//     </Pressable>
//   )
// }

function LocaleToggleButton() {
  const { theme } = useThemeContext()
  const { locale, setLocale } = useTranslation()
  const nextLocale = cycleLocale(locale)

  return (
    <Pressable
      onPress={() => setLocale(nextLocale)}
      style={{
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
  const { theme } = useThemeContext()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{
        zIndex: 100,
        backgroundColor: theme === 'dark' ? colors.bg.dark.default : colors.white,
        paddingTop: Platform.OS !== 'web' && insets.top > 20
          ? insets.top - 26
          : insets.top || 12,
        paddingBottom: Platform.OS !== 'web' && insets.top > 20 ? 4 : 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <LocaleToggleButton />
      {/* SC-28: <ThemeToggleButton /> hidden for MVP (light-only). */}
    </View>
  )
}

/** Default export for Expo Router (prevents "missing default export" warning). */
export default function FloatingTogglesRoute() {
  return null
}
