import { useState } from 'react'
import { View, Text, Platform } from 'react-native'
import { Stack } from '../Layout'
import { Row } from '../Layout'
import { Button } from '../Button'
import { Heading } from '../Typography'
import { Paragraph } from '../Typography'
import { useCookieConsent } from './CookieConsentProvider'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'
import { useThemeContext } from '../../theme'

export interface CookieConsentBannerProps {
  /** Privacy policy URL for the link in the description */
  privacyPolicyUrl?: string
  /** Container style (e.g. for maxWidth) */
  style?: { maxWidth?: number; [key: string]: unknown }
}

export function CookieConsentBanner({ privacyPolicyUrl, style: styleProp }: CookieConsentBannerProps) {
  const { shouldShowBanner, acceptAll, rejectAll, openPreferences, isReady } = useCookieConsent()
  const [pendingAction, setPendingAction] = useState<'accept' | 'reject' | null>(null)
  const { theme } = useThemeContext()

  if (!isReady || !shouldShowBanner) {
    return null
  }

  const isWeb = Platform.OS === 'web'
  const maxWidth = styleProp?.maxWidth ?? 500

  const cardBg = colors.bg[theme].default
  const cardBorder = colors.border[theme].default
  const titleColor = colors.text[theme].primary
  const bodyColor = colors.text[theme].secondary
  const linkColor = theme === 'light' ? colors.primary[600] : colors.primary[400]

  return (
    <View
      style={{
        position: 'absolute',
        bottom: spacing[16],
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingHorizontal: spacing[8],
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: cardBg,
          borderRadius: borderRadius.xl,
          padding: spacing[16],
          borderWidth: 1,
          borderColor: cardBorder,
          ...shadows.soft,
        }}
      >
        <Stack gap={spacing[12]}>
          <Stack gap={spacing[8]}>
            <Heading level={6} style={{ color: titleColor }}>
              This site uses cookies
            </Heading>
            <Paragraph size="sm" style={{ color: bodyColor }}>
              We use cookies to make things work smoothly and help us learn.
              {privacyPolicyUrl ? (
                <>
                  {' '}
                  <Text
                    style={{ color: linkColor, textDecorationLine: 'underline' }}
                    onPress={() => isWeb && window.open(privacyPolicyUrl, '_blank')}
                  >
                    Review our privacy policy
                  </Text>
                  {' '}
                </>
              ) : null}
              to learn more.
            </Paragraph>
          </Stack>
          <Row gap={spacing[8]} justify="space-between" align="center" style={{ flexWrap: 'wrap' }}>
            <Button variant="outline" color="gray" size="md" onPress={openPreferences}>
              Manage
            </Button>
            <Row gap={spacing[8]}>
              <Button
                color="success"
                variant="filled"
                size="md"
                onPress={async () => {
                  setPendingAction('accept')
                  try {
                    await acceptAll()
                  } finally {
                    setPendingAction(null)
                  }
                }}
                disabled={pendingAction !== null}
              >
                Accept
              </Button>
              <Button
                color="error"
                variant="filled"
                size="md"
                onPress={async () => {
                  setPendingAction('reject')
                  try {
                    await rejectAll()
                  } finally {
                    setPendingAction(null)
                  }
                }}
                disabled={pendingAction !== null}
              >
                Reject
              </Button>
            </Row>
          </Row>
        </Stack>
      </View>
    </View>
  )
}
