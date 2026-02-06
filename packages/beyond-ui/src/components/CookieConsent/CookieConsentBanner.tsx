import { useState } from 'react'
import { View, Text, Platform } from 'react-native'
import { Stack } from '../Layout'
import { Row } from '../Layout'
import { Button } from '../Button'
import { Paragraph } from '../Typography'
import { useCookieConsent } from './CookieConsentProvider'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'

export interface CookieConsentBannerProps {
  /** Privacy policy URL for the link in the description */
  privacyPolicyUrl?: string
  /** Container style (e.g. for maxWidth) */
  style?: { maxWidth?: number; [key: string]: unknown }
}

export function CookieConsentBanner({ privacyPolicyUrl, style: styleProp }: CookieConsentBannerProps) {
  const { shouldShowBanner, acceptAll, rejectAll, openPreferences, isReady } = useCookieConsent()
  const [pendingAction, setPendingAction] = useState<'accept' | 'reject' | null>(null)

  if (!isReady || !shouldShowBanner) {
    return null
  }

  const isWeb = Platform.OS === 'web'
  const maxWidth = styleProp?.maxWidth ?? 500
  const containerStyle = {
    position: 'absolute' as const,
    bottom: 24,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: spacing[4],
    alignItems: 'center' as const,
  }

  return (
    <View style={containerStyle}>
      <View
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: colors.bg.light.default,
          borderRadius: borderRadius.l,
          padding: spacing[5],
          borderWidth: 1,
          borderColor: colors.border.light.default,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <Stack gap={spacing[3]}>
          <Stack gap={spacing[2]}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.light.primary }}>
              This site uses cookies
            </Text>
            <Paragraph
              style={{
                fontSize: 14,
                color: colors.text.light.secondary,
                lineHeight: 20,
              }}
            >
              We use cookies to make things work smoothly and help us learn.
              {privacyPolicyUrl ? (
                <>
                  {' '}
                  <Text
                    style={{ color: colors.primary[600], textDecorationLine: 'underline' }}
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
          <Row gap={spacing[2]} justify="space-between" align="center" style={{ flexWrap: 'wrap' }}>
            <Button variant="outline" color="gray" size="md" onPress={openPreferences}>
              Manage
            </Button>
            <Row gap={spacing[2]}>
              <Button
                color="primary"
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
                color="gray"
                variant="outline"
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
