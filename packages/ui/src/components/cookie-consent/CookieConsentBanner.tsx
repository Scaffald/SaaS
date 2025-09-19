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
  XStack,
  YStack,
  type StackProps,
} from 'tamagui'

import { useCookieConsent } from './CookieConsentProvider'

export interface CookieConsentBannerProps extends CardProps {
  title?: string
  description?: ReactNode
  privacyPolicyUrl?: string
  manageLabel?: string
  rejectLabel?: string
  acceptLabel?: string
  manageHelperText?: string
  containerProps?: StackProps
}

const defaultDescription = (privacyPolicyUrl?: string) => (
  <Paragraph size="$3" lineHeight="$4" color="$color11">
    We use cookies to make things work smoothly and help us learn what’s effective.{' '}
    {privacyPolicyUrl ? (
      <Anchor href={privacyPolicyUrl} target="_blank" rel="noreferrer noopener">
        Review our privacy policy
      </Anchor>
    ) : (
      <>Review our privacy policy</>
    )}{' '}
    to learn more or adjust your choice below.
  </Paragraph>
)

export const CookieConsentBanner = ({
  title = 'This site uses cookies',
  description,
  privacyPolicyUrl,
  manageLabel = 'Manage cookies',
  rejectLabel = 'Reject',
  acceptLabel = 'Accept all',
  manageHelperText,
  containerProps,
  ...cardProps
}: CookieConsentBannerProps) => {
  const { shouldShowBanner, acceptAll, rejectAll, openPreferences, isReady } = useCookieConsent()
  const [pendingAction, setPendingAction] = useState<'accept' | 'reject' | null>(null)
  const isWeb = Platform.OS === 'web'

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
          bottom={isWeb ? '$4' : '$3'}
          left="$4"
          right="$4"
          zIndex={1000}
          style={isWeb ? { position: 'fixed' } : undefined}
          {...containerProps}
        >
          <Card elevate size="$4" padding="$4" gap="$3" {...cardProps}>
            <XStack gap="$4" ai="flex-start" flexWrap="wrap" $gtSm={{ ai: 'center' }}>
              <YStack f={1} gap="$2" miw={220}>
                <SizableText size="$6" fontWeight="700">
                  {title}
                </SizableText>
                {description ? description : defaultDescription(privacyPolicyUrl)}
              </YStack>
              <YStack gap="$2" w="100%" miw={220} $gtSm={{ w: 'auto', ai: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="$3"
                  onPress={openPreferences}
                  borderColor="$color6"
                >
                  {manageLabel}
                </Button>
                <XStack gap="$2" w="100%" $gtSm={{ w: 'auto' }}>
                  <Button
                    size="$3"
                    theme="alt2"
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
                    {rejectLabel}
                  </Button>
                  <Button
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
                    {acceptLabel}
                  </Button>
                </XStack>
              </YStack>
            </XStack>
            {!!manageHelperText && (
              <Paragraph size="$2" color="$color10">
                {manageHelperText}
              </Paragraph>
            )}
          </Card>
        </YStack>
      )}
    </AnimatePresence>
  )
}
