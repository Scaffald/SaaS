import { Row, Text } from '@scaffald/ui'
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
 * flow coherent.
 */
export function IntentBanner() {
  const { intent } = useLocalSearchParams<{ intent?: string }>()
  const { t } = useTranslation()

  if (intent !== 'worker' && intent !== 'org') return null

  const message = intent === 'worker' ? t('auth.login.intentWorker') : t('auth.login.intentOrg')

  return (
    <View
      style={{
        backgroundColor: 'rgba(29,114,130,0.10)',
        borderWidth: 1,
        borderColor: 'rgba(29,114,130,0.28)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%',
      }}
    >
      <Row gap={8} align="center">
        <Text size="sm" style={{ color: colors.text.light.secondary, flex: 1 }}>
          {message}
        </Text>
      </Row>
    </View>
  )
}
