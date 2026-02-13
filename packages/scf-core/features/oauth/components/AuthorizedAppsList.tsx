/**
 * Authorized Apps List Component
 * User can view and revoke authorized OAuth apps
 */

import {
  Button,
  Card,
  Paragraph,
  SizableText,
  Row,
  Stack,
  AlertDialog,
  Separator,
} from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { api } from '@scf/core/utils/api'
import type { OAuthApp } from '@scf/schemas/oauth'

export function AuthorizedAppsList() {
  const [revokeAppId, setRevokeAppId] = useState<string | null>(null)

  const consentsQuery = api.oauth.listUserConsents.useQuery()
  const revokeConsent = api.oauth.revokeConsent.useMutation({
    onSuccess: () => {
      consentsQuery.refetch()
      setRevokeAppId(null)
    },
  })

  const consents = consentsQuery.data?.consents || []
  const appToRevoke = consents.find((c) => c.id === revokeAppId)

  if (consentsQuery.isLoading) {
    return (
      <Stack flex={1} padding={16} gap={16}>
        <SizableText>Loading authorized apps...</SizableText>
      </Stack>
    )
  }

  return (
    <Stack flex={1} gap={16} data-testid="authorized-apps-list">
      {/* Header */}
      <Stack gap={8}>
        <SizableText size={24}>Authorized Applications</SizableText>
        <Paragraph size={12} color="gray">
          These apps have access to your Scaffald account. You can revoke access at any time.
        </Paragraph>
      </Stack>

      {/* Apps List */}
      {consents.length > 0 ? (
        <Stack gap={12}>
          {consents.map((consent) => {
            const app = consent.oauth_app as OAuthApp | undefined
            const grantedAt = new Date(consent.granted_at)
            const expiresAt = consent.expires_at ? new Date(consent.expires_at) : null

            return (
              <Card key={consent.id} padding={16} data-testid={`authorized-app-${consent.id}`}>
                <Row gap={16} align="flex-start">
                  {/* App Logo */}
                  {app?.logo_url && (
                    <Stack
                      width={64}
                      height={64}
                      borderRadius={8}
                      overflow="hidden"
                      backgroundColor="$color3"
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
                      <SizableText size={20} data-testid="authorized-app-name">
                        {app?.display_name || 'Unknown App'}
                      </SizableText>
                      {app?.description && (
                        <Paragraph size={12} color="gray" data-testid="authorized-app-description">
                          {app.description}
                        </Paragraph>
                      )}
                      {app?.homepage_url && (
                        <SizableText size={8} color="$blue10" data-testid="authorized-app-homepage">
                          {app.homepage_url}
                        </SizableText>
                      )}
                    </Stack>

                    <Separator />

                    {/* Scopes */}
                    <Stack gap={8}>
                      <SizableText size={12}>Permissions</SizableText>
                      <Stack gap={4}>
                        {consent.granted_scopes.map((scope) => (
                          <Row key={scope} gap={8} align="center">
                            <SizableText size={4} color="gray">
                              •
                            </SizableText>
                            <SizableText size={8} color="gray">
                              {scope}
                            </SizableText>
                          </Row>
                        ))}
                      </Stack>
                    </Stack>

                    {/* Metadata */}
                    <Stack gap={4}>
                      <SizableText size={8} color="gray">
                        Authorized on {grantedAt.toLocaleDateString()}
                      </SizableText>
                      {expiresAt && (
                        <SizableText size={8} color="gray">
                          Expires on {expiresAt.toLocaleDateString()}
                        </SizableText>
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
        <Card padding={24} data-testid="no-authorized-apps">
          <Stack gap={12} align="center">
            <SizableText size={20}>No Authorized Apps</SizableText>
            <Paragraph size={12} color="gray" textAlign="center">
              You haven't authorized any third-party applications to access your account yet.
            </Paragraph>
          </Stack>
        </Card>
      )}

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeAppId} onOpenChange={(open) => !open && setRevokeAppId(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content>
            <Stack gap={16}>
              <Stack gap={8}>
                <AlertDialog.Title>Revoke App Access</AlertDialog.Title>
                <AlertDialog.Description>
                  Are you sure you want to revoke access for{' '}
                  <strong>{(appToRevoke?.oauth_app as OAuthApp | undefined)?.display_name}</strong>?
                  This will:
                </AlertDialog.Description>
              </Stack>

              <Stack gap={8} paddingLeft={16}>
                <Paragraph size={12}>• Immediately invalidate all access tokens</Paragraph>
                <Paragraph size={12}>• Prevent the app from accessing your data</Paragraph>
                <Paragraph size={12}>
                  • Require you to re-authorize if you want to use the app again
                </Paragraph>
              </Stack>

              <Row gap={12} justify="flex-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialog.Cancel>
                <Button
                  onPress={() => revokeAppId && revokeConsent.mutate({ consent_id: revokeAppId })}
                  disabled={revokeConsent.isPending}
                  loading={revokeConsent.isPending}
                  backgroundColor="$red10"
                  data-testid="confirm-revoke-button"
                >
                  Revoke Access
                </Button>
              </Row>
            </Stack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </Stack>
  )
}
