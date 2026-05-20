/**
 * Connected accounts settings section.
 *
 * Renders the current user's Supabase identities, lets them link new ones
 * (Google / Apple) and disconnect existing ones. Backs the SC-62 settings
 * surface — the underlying linkIdentity / unlinkIdentity APIs require
 * `security_manual_linking_enabled: true` on the Supabase project (set
 * during SC-62 Phase 1).
 *
 * Native iOS / Android: we keep this web-only for v1. The native
 * linkIdentity OAuth flow needs expo-web-browser plumbing for the
 * round-trip return; until that lands, native shows a "manage on web"
 * notice. The Phase 1 auto-link for verified-email cross-provider sign-ins
 * still works on native — this UI is only for *manual* link/unlink.
 */

import { useState } from 'react'
import { Platform } from 'react-native'
import type { UserIdentity } from '@supabase/auth-js'
import {
  Button,
  Card,
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  Paragraph,
  Row,
  Stack,
  Text,
  useThemeContext,
  useToast,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

import { useTranslation } from '@scf/core/utils/useTranslation'
import { useConnectedAccounts } from '../hooks/useConnectedAccounts'

const ALL_PROVIDERS = ['google', 'apple'] as const

export function ConnectedAccounts() {
  const { t } = useTranslation()
  const toast = useToast()
  const { theme } = useThemeContext()
  const themeKey = theme === 'dark' ? 'dark' : 'light'
  const secondaryText = colors.text[themeKey].secondary

  const { identities, isLoading, isMutating, link, unlink, isLastIdentity } =
    useConnectedAccounts()
  const [pendingUnlink, setPendingUnlink] = useState<UserIdentity | null>(null)

  const linkedProviders = new Set(identities.map((i) => i.provider))
  const isWeb = Platform.OS === 'web'

  const handleLink = async (provider: 'google' | 'apple') => {
    const result = await link(provider)
    if (!result.ok) {
      toast.show({
        message: t('auth.connectedAccounts.linkError', {
          provider: providerLabel(provider, t),
        }),
        variant: 'error',
        duration: 5000,
      })
    }
    // On success, supabase-js redirects the browser; control doesn't
    // return here in the normal path.
  }

  const handleUnlinkConfirm = async () => {
    if (!pendingUnlink) return
    const result = await unlink(pendingUnlink)
    if (result.ok) {
      toast.show({
        message: t('auth.connectedAccounts.unlinkSuccess', {
          provider: providerLabel(pendingUnlink.provider, t),
        }),
        variant: 'success',
        duration: 4000,
      })
    } else {
      toast.show({
        message: t('auth.connectedAccounts.unlinkError', {
          provider: providerLabel(pendingUnlink.provider, t),
        }),
        variant: 'error',
        duration: 5000,
      })
    }
    setPendingUnlink(null)
  }

  return (
    <Stack gap={12} data-testid="connected-accounts">
      <Text size="xl">{t('auth.connectedAccounts.title')}</Text>
      <Paragraph size="sm" style={{ color: secondaryText }}>
        {t('auth.connectedAccounts.description')}
      </Paragraph>

      {isLoading ? (
        <Card padding="md">
          <Text size="sm">{t('common.loading')}</Text>
        </Card>
      ) : (
        <Stack gap={12}>
          {identities.length === 0 && (
            <Card padding="md">
              <Text size="sm" style={{ color: secondaryText }}>
                {t('auth.connectedAccounts.empty')}
              </Text>
            </Card>
          )}

          {identities.map((identity) => {
            const last = isLastIdentity(identity)
            const linkedAt = identity.created_at
              ? new Date(identity.created_at).toLocaleDateString()
              : null
            return (
              <Card
                key={identity.identity_id}
                padding="md"
                data-testid={`connected-identity-${identity.provider}`}
              >
                <Row align="center" justify="space-between" gap={16}>
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Text size="md">{providerLabel(identity.provider, t)}</Text>
                    {linkedAt && (
                      <Text size="sm" style={{ color: secondaryText }}>
                        {t('auth.connectedAccounts.linkedAt', { date: linkedAt })}
                      </Text>
                    )}
                    {identity.identity_data?.email && (
                      <Text size="sm" style={{ color: secondaryText }}>
                        {String(identity.identity_data.email)}
                      </Text>
                    )}
                    {last && (
                      <Text size="sm" style={{ color: colors.fg[themeKey].error }}>
                        {t('auth.connectedAccounts.lastIdentityWarning')}
                      </Text>
                    )}
                  </Stack>
                  <Button
                    variant="outline"
                    disabled={last || isMutating}
                    onPress={() => setPendingUnlink(identity)}
                    data-testid={`disconnect-${identity.provider}`}
                  >
                    {isMutating
                      ? t('auth.connectedAccounts.disconnecting')
                      : t('auth.connectedAccounts.disconnect')}
                  </Button>
                </Row>
              </Card>
            )
          })}

          {ALL_PROVIDERS.filter((p) => !linkedProviders.has(p)).map((provider) => (
            <Card
              key={`add-${provider}`}
              padding="md"
              data-testid={`add-${provider}`}
            >
              <Row align="center" justify="space-between" gap={16}>
                <Stack gap={4} style={{ flex: 1 }}>
                  <Text size="md">{providerLabel(provider, t)}</Text>
                  {!isWeb && (
                    <Text size="sm" style={{ color: secondaryText }}>
                      {t('auth.connectedAccounts.manageOnWeb')}
                    </Text>
                  )}
                </Stack>
                <Button
                  variant="filled"
                  color="primary"
                  disabled={!isWeb || isMutating}
                  onPress={() => handleLink(provider)}
                  data-testid={`connect-${provider}`}
                >
                  {isMutating
                    ? t('auth.connectedAccounts.connecting')
                    : provider === 'google'
                      ? t('auth.connectedAccounts.addGoogle')
                      : t('auth.connectedAccounts.addApple')}
                </Button>
              </Row>
            </Card>
          ))}
        </Stack>
      )}

      <Modal
        visible={!!pendingUnlink}
        onClose={() => setPendingUnlink(null)}
        testID="disconnect-identity-dialog"
      >
        <ModalContent>
          <ModalHeader
            title={t('auth.connectedAccounts.disconnect')}
            onClose={() => setPendingUnlink(null)}
          />
          <Stack gap={16}>
            <Paragraph size="sm">
              {pendingUnlink
                ? t('auth.connectedAccounts.unlinkSuccess', {
                    provider: providerLabel(pendingUnlink.provider, t),
                  })
                : ''}
            </Paragraph>
            <ModalActions
              primaryAction={{
                label: t('auth.connectedAccounts.disconnect'),
                onPress: handleUnlinkConfirm,
                disabled: isMutating,
                loading: isMutating,
                color: 'error',
              }}
              secondaryAction={{
                label: t('common.cancel'),
                onPress: () => setPendingUnlink(null),
                variant: 'outline',
              }}
            />
          </Stack>
        </ModalContent>
      </Modal>
    </Stack>
  )
}

function providerLabel(provider: string, t: (key: string) => string): string {
  if (provider === 'google') return t('auth.connectedAccounts.providerGoogle')
  if (provider === 'apple') return t('auth.connectedAccounts.providerApple')
  if (provider === 'email') return t('auth.connectedAccounts.providerEmail')
  return provider
}
