import { useState } from 'react'
import type { CardProps } from '@tamagui/card'
import { Card } from '@tamagui/card'
import { Paragraph, SizableText, AnimatePresence, Anchor } from 'tamagui'
import type { StackProps } from '@tamagui/core'
import { XStack, YStack } from '@tamagui/stacks'

import { useCookieConsent } from './CookieConsentProvider'
import { Button } from '../buttons/Button'

export interface CookieConsentBannerProps extends CardProps {
  containerProps?: StackProps
}

export const CookieConsentBanner = ({ containerProps, ...cardProps }: CookieConsentBannerProps) => {
  const { shouldShowBanner, acceptAll, rejectAll, openPreferences, isReady } = useCookieConsent()
  const [pendingAction, setPendingAction] = useState<'accept' | 'reject' | null>(null)

  if (!isReady) {
    return null
  }

  return (
    <AnimatePresence>
      {shouldShowBanner && (
        <YStack
          key="cookie-consent-banner"
          animation="quick"
          enterStyle={{ opacity: 0, y: 16 }}
          exitStyle={{ opacity: 0, y: 16 }}
          flex={1}
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            zIndex: 1000,
            transform: 'translateX(-50%)',
            maxWidth: 500,
          }}
          {...containerProps}
        >
          <Card elevate size="$4" p="$5" gap="$3" {...cardProps}>
            <XStack gap="$4" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <YStack flex={1} gap="$2" style={{ minWidth: 220 }}>
                <SizableText size="$6" fontWeight="700">
                  This site uses cookies
                </SizableText>
                <Paragraph size="$3" lineHeight="$4" color="$color11">
                  We use cookies to make things work smoothly and help us learn.{' '}
                  <Anchor
                    href="https://scaffald.com/privacy"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Review our privacy policy
                  </Anchor>{' '}
                  to learn more.
                </Paragraph>
              </YStack>
              <XStack gap="$2" width="100%" style={{ justifyContent: 'space-between' }}>
                <Button size="$3" onPress={openPreferences} borderColor="$color6" type="button">
                  Manage
                </Button>

                <Button
                  theme="success"
                  size="$3"
                  onPress={async () => {
                    setPendingAction('accept')
                    try {
                      await acceptAll()
                    } finally {
                      setPendingAction(null)
                    }
                  }}
                  disabled={pendingAction !== null}
                  flex={1}
                >
                  Accept
                </Button>
                <Button
                  theme="error"
                  size="$3"
                  onPress={async () => {
                    setPendingAction('reject')
                    try {
                      await rejectAll()
                    } finally {
                      setPendingAction(null)
                    }
                  }}
                  disabled={pendingAction !== null}
                  flex={1}
                >
                  Reject
                </Button>
              </XStack>
            </XStack>
          </Card>
        </YStack>
      )}
    </AnimatePresence>
  )
}
