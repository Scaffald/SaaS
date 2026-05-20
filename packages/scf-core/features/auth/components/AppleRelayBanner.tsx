/**
 * Apple Hide-My-Email relay banner (SC-62 Phase 3).
 *
 * Apple's "Hide My Email" returns a per-user `@privaterelay.appleid.com`
 * address that doesn't match the user's real email, so Supabase can't
 * email-link the Apple identity to an existing magic-link or Google
 * account. That silently fragments one human across two Scaffald accounts.
 *
 * This banner appears once for relay-email users, explains the situation,
 * and points them to the connected-accounts settings (with an explicit
 * "sign out & switch" affordance for the case where they want to add
 * Apple to a different existing account).
 *
 * Dismissal is persisted in `user.user_metadata.apple_relay_dismissed_at`
 * so it stays dismissed across devices. We deliberately do NOT auto-merge
 * accounts server-side — that's tracked separately and requires more care
 * than a single-session flow can give it.
 */

import { useCallback, useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Button,
  Card,
  Paragraph,
  Row,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'

import { ROUTES } from '@scf/core/constants/routes'
import { useAuth } from '@scf/core/provider/auth/useAuth'
import { captureEvent } from '@scf/core/utils/analytics/client'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'

import { isAppleRelayEmail } from '../utils/appleRelay'

export function AppleRelayBanner() {
  const { session, signOut } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const { theme } = useThemeContext()
  const themeKey = theme === 'dark' ? 'dark' : 'light'
  const [dismissed, setDismissed] = useState(false)
  const [hasCaptured, setHasCaptured] = useState(false)

  const email = session?.user?.email ?? null
  const userMetadata = session?.user?.user_metadata as
    | { apple_relay_dismissed_at?: string }
    | undefined
  const alreadyDismissed = !!userMetadata?.apple_relay_dismissed_at
  const shouldShow = !dismissed && !alreadyDismissed && isAppleRelayEmail(email)

  useEffect(() => {
    if (shouldShow && !hasCaptured) {
      captureEvent('auth_apple_relay_banner_shown', {})
      setHasCaptured(true)
    }
  }, [shouldShow, hasCaptured])

  const persistDismissal = useCallback(async () => {
    try {
      await supabase.auth.updateUser({
        data: { apple_relay_dismissed_at: new Date().toISOString() },
      })
    } catch {
      // Best-effort: if the metadata update fails, we still hide the
      // banner locally so the user isn't blocked.
    }
  }, [])

  const handleDismiss = useCallback(async () => {
    setDismissed(true)
    captureEvent('auth_apple_relay_banner_dismissed', { action: 'dismiss' })
    await persistDismissal()
  }, [persistDismissal])

  const handleSignOut = useCallback(async () => {
    setDismissed(true)
    captureEvent('auth_apple_relay_banner_dismissed', { action: 'sign_out' })
    await persistDismissal()
    await signOut()
    router.replace(ROUTES.AUTH.LOGIN.path)
  }, [persistDismissal, signOut, router])

  if (!shouldShow) return null

  return (
    <Card padding="md" data-testid="apple-relay-banner">
      <Stack gap={spacing[12]}>
        <Stack gap={spacing[4]}>
          <Text size="md">{t('auth.connectedAccounts.appleRelayBannerTitle')}</Text>
          <Paragraph size="sm" style={{ color: colors.text[themeKey].secondary }}>
            {t('auth.connectedAccounts.appleRelayBannerBody')}
          </Paragraph>
        </Stack>
        <Row gap={spacing[8]} align="center" wrap>
          <Button variant="filled" color="primary" onPress={handleSignOut}>
            {t('auth.connectedAccounts.appleRelayBannerSignOut')}
          </Button>
          <Pressable onPress={handleDismiss}>
            <Text
              size="sm"
              style={{
                color: colors.text[themeKey].secondary,
                textDecorationLine: 'underline',
              }}
            >
              {t('auth.connectedAccounts.appleRelayBannerDismiss')}
            </Text>
          </Pressable>
        </Row>
      </Stack>
    </Card>
  )
}
