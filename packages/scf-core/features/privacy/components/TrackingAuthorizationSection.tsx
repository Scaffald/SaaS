/**
 * App Tracking Transparency status panel for the Privacy & Data screen.
 *
 * Apple does not let an app re-prompt for ATT after the first decision —
 * the only way for a user to change their mind is via iOS Settings →
 * Privacy & Security → Tracking. So we display the current state and offer
 * a deep-link.
 *
 * On Android and web the panel renders nothing (the hook reports
 * `isApplicable === false`).
 */

import { useCallback } from 'react'
import { Linking, Platform } from 'react-native'
import { Button, Card, Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Eye, EyeOff, Settings as SettingsIcon } from 'lucide-react-native'

import { useTrackingAuthorization } from '@scf/core/utils/privacy'

const STATUS_COPY: Record<
  'granted' | 'denied' | 'restricted' | 'not-determined',
  { title: string; body: string; tone: 'positive' | 'neutral' | 'warning' }
> = {
  granted: {
    title: 'Tracking allowed',
    body: 'You agreed to let Scaffald link your activity to your account for cross-device sync and personalized analytics. You can revoke this at any time in iOS Settings.',
    tone: 'positive',
  },
  denied: {
    title: 'Tracking disabled',
    body: 'Scaffald is collecting anonymous usage analytics only. We are not linking events to your account or sharing identifiers with third parties.',
    tone: 'neutral',
  },
  restricted: {
    title: 'Tracking restricted',
    body: 'Tracking is blocked by parental controls or a device management profile. Scaffald is running with anonymous analytics only.',
    tone: 'neutral',
  },
  'not-determined': {
    title: 'Tracking permission pending',
    body: 'We have not yet asked for permission to link your activity to your account. The system prompt will appear the next time you sign in.',
    tone: 'warning',
  },
}

export function TrackingAuthorizationSection() {
  const { theme } = useThemeContext()
  const { status, isApplicable } = useTrackingAuthorization()

  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      void Linking.openURL('app-settings:')
    }
  }, [])

  if (!isApplicable) return null
  if (status === 'unavailable') return null

  const copy = STATUS_COPY[status]
  const Icon = status === 'granted' ? Eye : EyeOff
  const accent =
    copy.tone === 'positive'
      ? colors.success[500]
      : copy.tone === 'warning'
        ? colors.warning[700]
        : colors.icon[theme].muted

  return (
    <Card variant="glass" padding="md">
      <Stack gap={12}>
        <Row gap={12} align="center">
          <Icon size={20} color={accent} />
          <Stack flex={1}>
            <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
              {copy.title}
            </Text>
            <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
              {copy.body}
            </Text>
          </Stack>
        </Row>
        <Row justify="flex-end">
          <Button size="sm" variant="outline" onPress={openSettings} iconStart={SettingsIcon}>
            Open iOS Settings
          </Button>
        </Row>
      </Stack>
    </Card>
  )
}
