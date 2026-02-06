import { useState } from 'react'
import type { CardProps } from '@tamagui/card'
import { Card } from '@tamagui/card'
import { Paragraph, SizableText, AnimatePresence, Anchor } from 'tamagui'
import type { StackProps } from '@tamagui/core'
import { XStack, YStack } from '@tamagui/stacks'

import { useCookieConsent } from './CookieConsentProvider'
import { Button } from '../buttons/Button'

/** Explicit colors so the banner has good contrast and responds to light/dark */
const BANNER_THEMES = {
  light: {
    cardBg: '#ffffff',
    cardBorder: '#e4e7ec',
    titleColor: '#141c25',
    bodyColor: '#344051',
    linkColor: '#2563eb',
    manageBg: 'transparent',
    manageColor: '#141c25',
    manageBorder: '#414e62',
    acceptBg: '#16a34a',
    acceptColor: '#ffffff',
    rejectBg: '#dc2626',
    rejectColor: '#ffffff',
  },
  dark: {
    cardBg: '#1a232d',
    cardBorder: '#344051',
    titleColor: '#ffffff',
    bodyColor: '#e4e7ec',
    linkColor: '#60a5fa',
    manageBg: 'transparent',
    manageColor: '#e4e7ec',
    manageBorder: '#97a1af',
    acceptBg: '#16a34a',
    acceptColor: '#ffffff',
    rejectBg: '#dc2626',
    rejectColor: '#ffffff',
  },
} as const

export interface CookieConsentBannerProps extends CardProps {
  containerProps?: StackProps
  /** When provided, banner uses explicit light/dark styling for contrast and theme consistency */
  theme?: 'light' | 'dark'
}

export const CookieConsentBanner = ({
  containerProps,
  theme: themeProp = 'light',
  ...cardProps
}: CookieConsentBannerProps) => {
  const { shouldShowBanner, acceptAll, rejectAll, openPreferences, isReady } = useCookieConsent()
  const [pendingAction, setPendingAction] = useState<'accept' | 'reject' | null>(null)
  const t = BANNER_THEMES[themeProp]

  if (!isReady) {
    return null
  }

  const containerStyle = {
    position: 'fixed' as const,
    bottom: 24,
    left: 0,
    right: 0,
    zIndex: 1000,
    width: '100%',
    maxWidth: 500,
    marginLeft: 'auto' as const,
    marginRight: 'auto' as const,
  }

  const { style: _containerStyleProp, ...restContainerProps } = containerProps ?? {}

  return (
    <AnimatePresence>
      {shouldShowBanner && (
        <YStack
          key="cookie-consent-banner"
          animation="quick"
          enterStyle={{ opacity: 0, y: 16 }}
          exitStyle={{ opacity: 0, y: 16 }}
          flex={1}
          style={containerStyle}
          {...restContainerProps}
        >
          <Card
            elevate
            size="$4"
            p="$5"
            gap="$3"
            background={t.cardBg}
            borderWidth={1}
            borderColor={t.cardBorder}
            {...cardProps}
          >
            <XStack gap="$4" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <YStack flex={1} gap="$2" style={{ minWidth: 220 }}>
                <SizableText size="$6" fontWeight="700" color={t.titleColor}>
                  This site uses cookies
                </SizableText>
                <Paragraph size="$3" lineHeight="$4" color={t.bodyColor}>
                  We use cookies to make things work smoothly and help us learn.{' '}
                  <Anchor
                    href="https://scaffald.com/privacy"
                    target="_blank"
                    rel="noreferrer noopener"
                    color={t.linkColor}
                  >
                    Review our privacy policy
                  </Anchor>{' '}
                  to learn more.
                </Paragraph>
              </YStack>
              <XStack gap="$2" width="100%" style={{ justifyContent: 'space-between' }}>
                <Button
                  size="$3"
                  onPress={openPreferences}
                  background={t.manageBg}
                  color={t.manageColor}
                  borderWidth={1}
                  borderColor={t.manageBorder}
                >
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
                  background={t.acceptBg}
                  color={t.acceptColor}
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
                  background={t.rejectBg}
                  color={t.rejectColor}
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
