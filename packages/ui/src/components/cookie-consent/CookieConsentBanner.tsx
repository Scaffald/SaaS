import { useState, type ReactNode } from 'react'
import { Platform } from 'react-native'
import {
  Anchor,
  AnimatePresence,
  Button,
  Card,
  CardProps,
  Paragraph,
  SizableText,
  View,
  XStack,
  YStack,
  type StackProps,
} from 'tamagui'

import { useCookieConsent } from './CookieConsentProvider'

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
          position="absolute"
          bottom="$6"
          left="50%"
          maxW={500}
          width="100%"
          zIndex={1000}
          transform={[{ translateX: '-50%' }]}
          {...containerProps}
        >
          <Card elevate size="$4" p="$5" gap="$3" {...cardProps}>
            <XStack gap="$4" ai="flex-start" flexWrap="wrap" $gtSm={{ ai: 'center' }}>
              <YStack f={1} gap="$2" miw={220}>
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
              <XStack gap="$2" w="100%" jc="space-between">
                <Button size="$3" onPress={openPreferences} borderColor="$color6">
                  Manage
                </Button>

                <Button
                  theme="green"
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
                  f={1}
                >
                  Accept
                </Button>
                <Button
                  theme="red"
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
                  f={1}
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
