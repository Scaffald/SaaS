/**
 * Authorized Apps List Component
 * User can view and revoke authorized OAuth apps
 */

import {
  Button,
  Card,
  Paragraph,
  Text,
  Row,
  Stack,
  Modal,
  ModalContent,
  ModalHeader,
  ModalActions,
  Separator,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useState } from 'react'
import { useUserConsents, useRevokeConsentMutation } from '@scf/core/utils/oauth-sdk-hooks'

export function AuthorizedAppsList() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [revokeAppId, setRevokeAppId] = useState<string | null>(null)

  const consentsQuery = useUserConsents()
  const revokeConsent = useRevokeConsentMutation({
    onSuccess: () => {
      consentsQuery.refetch()
      setRevokeAppId(null)
    },
  })

  const consents = consentsQuery.data?.consents || []
  const appToRevoke = consents.find((c) => c.id === revokeAppId)

  if (consentsQuery.isLoading) {
    return (
      <Stack flex={1} padding="md" gap={16}>
        <Text>Loading authorized apps...</Text>
      </Stack>
    )
  }

  return (
    <Stack flex={1} gap={16} data-testid="authorized-apps-list">
      {/* Header */}
      <Stack gap={8}>
        <Text size="2xl">Authorized Applications</Text>
        <Paragraph size="sm" style={{ color: colors.text[t].secondary }}>
          These apps have access to your Scaffald account. You can revoke access at any time.
        </Paragraph>
      </Stack>

      {/* Apps List */}
      {consents.length > 0 ? (
        <Stack gap={12}>
          {consents.map((consent) => {
            const app = consent.oauth_app
            const grantedAt = new Date(consent.granted_at)
            const expiresAt = consent.expires_at ? new Date(consent.expires_at) : null

            return (
              <Card key={consent.id} padding="md" data-testid={`authorized-app-${consent.id}`}>
                <Row gap={16} align="flex-start">
                  {/* App Logo */}
                  {app?.logo_url && (
                    <Stack
                      width={64}
                      height={64}
                      style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: colors.bg[t].muted }}
                    >
                      <img
                        src={app.logo_url}
                        alt={app.display_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Stack>
                  )}

                  {/* App Info */}
                  <Stack flex={1} gap={12}>
                    <Stack gap={4}>
                      <Text size="lg" data-testid="authorized-app-name">
                        {app?.display_name || 'Unknown App'}
                      </Text>
                      {app?.description && (
                        <Paragraph
                          size="sm"
                          style={{ color: colors.text[t].secondary }}
                          data-testid="authorized-app-description"
                        >
                          {app.description}
                        </Paragraph>
                      )}
                      {app?.homepage_url && (
                        <Text
                          size="sm"
                          style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[600] }}
                          data-testid="authorized-app-homepage"
                        >
                          {app.homepage_url}
                        </Text>
                      )}
                    </Stack>

                    <Separator />

                    {/* Scopes */}
                    <Stack gap={8}>
                      <Text size="sm">Permissions</Text>
                      <Stack gap={4}>
                        {consent.granted_scopes.map((scope) => (
                          <Row key={scope} gap={8} align="center">
                            <Text size="sm" style={{ color: colors.text[t].secondary }}>
                              •
                            </Text>
                            <Text size="sm" style={{ color: colors.text[t].secondary }}>
                              {scope}
                            </Text>
                          </Row>
                        ))}
                      </Stack>
                    </Stack>

                    {/* Metadata */}
                    <Stack gap={4}>
                      <Text size="sm" style={{ color: colors.text[t].secondary }}>
                        {`Authorized on ${grantedAt.toLocaleDateString()}`}
                      </Text>
                      {expiresAt && (
                        <Text size="sm" style={{ color: colors.text[t].secondary }}>
                          {`Expires on ${expiresAt.toLocaleDateString()}`}
                        </Text>
                      )}
                    </Stack>
                  </Stack>

                  {/* Actions */}
                  <Button
                    variant="outline"
                    onPress={() => setRevokeAppId(consent.id)}
                    data-testid={`revoke-app-button-${consent.id}`}
                  >
                    Revoke Access
                  </Button>
                </Row>
              </Card>
            )
          })}
        </Stack>
      ) : (
        <Card padding="xl" data-testid="no-authorized-apps">
          <Stack gap={12} align="center">
            <Text size="lg">No Authorized Apps</Text>
            <Paragraph size="sm" style={{ color: colors.text[t].secondary }} align="center">
              You haven't authorized any third-party applications to access your account yet.
            </Paragraph>
          </Stack>
        </Card>
      )}

      {/* Revoke Confirmation Dialog */}
      <Modal
        visible={!!revokeAppId}
        onClose={() => setRevokeAppId(null)}
        testID="revoke-app-dialog"
      >
        <ModalContent>
          <ModalHeader title="Revoke App Access" onClose={() => setRevokeAppId(null)} />
          <Stack gap={16}>
            <Paragraph size="sm">
              Are you sure you want to revoke access for{' '}
              <strong>{appToRevoke?.oauth_app?.display_name}</strong>?
              This will:
            </Paragraph>
            <Stack gap={8} style={{ paddingLeft: 16 }}>
              <Paragraph size="sm">• Immediately invalidate all access tokens</Paragraph>
              <Paragraph size="sm">• Prevent the app from accessing your data</Paragraph>
              <Paragraph size="sm">
                • Require you to re-authorize if you want to use the app again
              </Paragraph>
            </Stack>
            <ModalActions
              primaryAction={{
                label: 'Revoke Access',
                onPress: () => revokeAppId && revokeConsent.mutate(revokeAppId),
                disabled: revokeConsent.isPending,
                loading: revokeConsent.isPending,
                color: 'error',
              }}
              secondaryAction={{
                label: 'Cancel',
                onPress: () => setRevokeAppId(null),
                variant: 'outline',
              }}
            />
          </Stack>
        </ModalContent>
      </Modal>
    </Stack>
  )
}
