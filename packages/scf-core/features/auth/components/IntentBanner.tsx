import { Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { useTranslation } from '../../../utils/useTranslation'

/**
 * Echoes back the choice a visitor made on the marketing page.
 *
 * The landing CTAs are explicit ("Create Your Worker Profile" vs "Register your
 * Organization") but both land on the same sign-in screen, which silently
 * discarded that intent. Carrying `?intent=` through and restating it keeps the
 * flow coherent. The card also opens on Create account for these visitors
 * (`initialAuthMode`, #1210).
 *
 * Drawn as a ruled note in the theme's selected tint: it sits inside the auth
 * card now, which follows the theme, so fixed light-mode colours would vanish
 * on the dark card.
 */
export function IntentBanner() {
  const { intent } = useLocalSearchParams<{ intent?: string }>()
  const { t } = useTranslation()
  const { theme } = useThemeContext()

  if (intent !== 'worker' && intent !== 'org') return null

  const message = intent === 'worker' ? t('auth.login.intentWorker') : t('auth.login.intentOrg')

  return (
    <View
      style={{
        backgroundColor: colors.bg[theme].selected,
        borderLeftWidth: 2,
        borderLeftColor: colors.border[theme].selected,
        paddingHorizontal: 14,
        paddingVertical: 10,
        width: '100%',
      }}
    >
      <Text size="sm" style={{ color: colors.text[theme].secondary }}>
        {message}
      </Text>
    </View>
  )
}
