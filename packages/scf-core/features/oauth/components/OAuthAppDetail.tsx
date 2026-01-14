/**
 * OAuth App Detail Component
 * REQ-10 Task 11: Admin OAuth app detail and approval
 */

import {
  Badge,
  Button,
  Card,
  Paragraph,
  SizableText,
  XStack,
  YStack,
  Separator,
  Checkbox,
  AlertDialog,
  Input,
} from '@unicornlove/ui'
import { useState } from 'react'
import { api } from '@scf/core/utils/api'
import { useRouter } from 'expo-router'
import { ROUTES } from '@scf/core/constants/routes'

interface OAuthAppDetailProps {
  appId: string
}

export function OAuthAppDetail({ appId }: OAuthAppDetailProps) {
  const router = useRouter()
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [trustLevel, setTrustLevel] = useState<'active' | 'trusted'>('active')
  const [rejectReason, setRejectReason] = useState('')
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)

  // Queries
  const appQuery = api.oauth.admin.getAppDetail.useQuery({ app_id: appId })
  const scopesQuery = api.oauth.admin.listScopes.useQuery()

  // Mutations
  const approveApp = api.oauth.admin.approveApp.useMutation({
    onSuccess: () => {
      appQuery.refetch()
      setShowApproveDialog(false)
    },
  })

  const rejectApp = api.oauth.admin.rejectApp.useMutation({
    onSuccess: () => {
      appQuery.refetch()
      setShowRejectDialog(false)
      router.push(ROUTES.OFFICE.OAUTH_APPS.path)
    },
  })

  const suspendApp = api.oauth.admin.suspendApp.useMutation({
    onSuccess: () => {
      appQuery.refetch()
      setShowSuspendDialog(false)
    },
  })

  const app = appQuery.data?.app
  const scopes = scopesQuery.data?.scopes || []

  if (appQuery.isLoading) {
    return (
      <YStack flex={1} padding="$4" gap="$4">
        <SizableText>Loading...</SizableText>
      </YStack>
    )
  }

  if (!app) {
    return (
      <YStack flex={1} padding="$4" gap="$4">
        <SizableText>App not found</SizableText>
      </YStack>
    )
  }

  const isPending = app.status === 'pending'
  const isActive = app.status === 'active' || app.status === 'trusted'
  const _isRevoked = app.status === 'revoked'

  const statusColor =
    app.status === 'active' || app.status === 'trusted'
      ? '$green10'
      : app.status === 'pending'
        ? '$yellow10'
        : app.status === 'suspended'
          ? '$orange10'
          : '$red10'

  function handleApprove() {
    approveApp.mutate({
      app_id: appId,
      allowed_scopes: selectedScopes,
      trust_level: trustLevel,
    })
  }

  function handleReject() {
    rejectApp.mutate({
      app_id: appId,
      reason: rejectReason || undefined,
    })
  }

  function handleSuspend() {
    suspendApp.mutate({
      app_id: appId,
    })
  }

  return (
    <YStack flex={1} gap="$4" data-testid="oauth-app-detail">
      {/* Header */}
      <XStack gap="$3" alignItems="center" justifyContent="space-between">
        <YStack gap="$2" flex={1}>
          <SizableText size="$6" fontWeight="600" data-testid="oauth-app-detail-name">
            {app.display_name}
          </SizableText>
          <XStack gap="$2" alignItems="center">
            <Badge backgroundColor={statusColor} color="white" data-testid="oauth-app-detail-status">
              {app.status.toUpperCase()}
            </Badge>
            {app.requires_approval && isPending && (
              <Badge backgroundColor="$blue10" color="white" data-testid="oauth-app-requires-approval">
                REQUIRES APPROVAL
              </Badge>
            )}
          </XStack>
        </YStack>

        {/* Action Buttons */}
        <XStack gap="$2" data-testid="oauth-app-actions">
          {isPending && (
            <>
              <Button variant="outlined" onPress={() => setShowRejectDialog(true)} data-testid="oauth-app-reject-button">
                Reject
              </Button>
              <Button onPress={() => setShowApproveDialog(true)} data-testid="oauth-app-approve-button">Approve</Button>
            </>
          )}
          {isActive && (
            <Button variant="outlined" onPress={() => setShowSuspendDialog(true)} data-testid="oauth-app-suspend-button">
              Suspend
            </Button>
          )}
        </XStack>
      </XStack>

      {/* App Details */}
      <Card padding="$4" gap="$4">
        <YStack gap="$3">
          <SizableText size="$5" fontWeight="600">
            Application Details
          </SizableText>

          <YStack gap="$2">
            <SizableText size="$3" color="$color11">
              Description
            </SizableText>
            <Paragraph size="$3">{app.description || 'No description provided'}</Paragraph>
          </YStack>

          <Separator />

          <YStack gap="$2">
            <SizableText size="$3" color="$color11">
              Client ID
            </SizableText>
            <SizableText size="$3" fontFamily="$mono" data-testid="oauth-app-client-id">
              {app.client_id}
            </SizableText>
          </YStack>

          <YStack gap="$2">
            <SizableText size="$3" color="$color11">
              Homepage URL
            </SizableText>
            <SizableText size="$3" color="$blue10">
              {app.homepage_url || 'Not provided'}
            </SizableText>
          </YStack>

          {app.privacy_policy_url && (
            <YStack gap="$2">
              <SizableText size="$3" color="$color11">
                Privacy Policy URL
              </SizableText>
              <SizableText size="$3" color="$blue10">
                {app.privacy_policy_url}
              </SizableText>
            </YStack>
          )}

          {app.terms_of_service_url && (
            <YStack gap="$2">
              <SizableText size="$3" color="$color11">
                Terms of Service URL
              </SizableText>
              <SizableText size="$3" color="$blue10">
                {app.terms_of_service_url}
              </SizableText>
            </YStack>
          )}

          <Separator />

          <YStack gap="$2">
            <SizableText size="$3" color="$color11">
              Owner Email
            </SizableText>
            <SizableText size="$3">{app.owner_email || 'Not provided'}</SizableText>
          </YStack>

          <YStack gap="$2">
            <SizableText size="$3" color="$color11">
              Created
            </SizableText>
            <SizableText size="$3">
              {new Date(app.created_at).toLocaleString()}
            </SizableText>
          </YStack>

          {app.approved_at && (
            <YStack gap="$2">
              <SizableText size="$3" color="$color11">
                Approved
              </SizableText>
              <SizableText size="$3">
                {new Date(app.approved_at).toLocaleString()}
              </SizableText>
            </YStack>
          )}
        </YStack>
      </Card>

      {/* Redirect URIs */}
      <Card padding="$4" gap="$4" data-testid="oauth-app-redirect-uris">
        <YStack gap="$3">
          <SizableText size="$5" fontWeight="600">
            Redirect URIs
          </SizableText>
          <YStack gap="$2">
            {app.redirect_uris.map((uri, index) => (
              <YStack key={index} gap="$1">
                <SizableText size="$3" fontFamily="$mono" color="$blue10" data-testid={`oauth-app-redirect-uri-${index}`}>
                  {uri}
                </SizableText>
              </YStack>
            ))}
          </YStack>
        </YStack>
      </Card>

      {/* Allowed Scopes */}
      <Card padding="$4" gap="$4" data-testid="oauth-app-scopes">
        <YStack gap="$3">
          <SizableText size="$5" fontWeight="600">
            Allowed Scopes
          </SizableText>
          {app.allowed_scopes.length > 0 ? (
            <XStack gap="$2" flexWrap="wrap">
              {app.allowed_scopes.map((scope) => (
                <Badge key={scope} backgroundColor="$blue2" color="$blue10" data-testid={`oauth-app-scope-${scope}`}>
                  {scope}
                </Badge>
              ))}
            </XStack>
          ) : (
            <Paragraph size="$3" color="$color11" data-testid="oauth-app-no-scopes">
              No scopes approved yet
            </Paragraph>
          )}
        </YStack>
      </Card>

      {/* Approve App Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content maxWidth={600}>
            <YStack gap="$4">
              <YStack gap="$2">
                <AlertDialog.Title>Approve OAuth Application</AlertDialog.Title>
                <AlertDialog.Description>
                  Select the scopes to grant and the trust level for {app.display_name}.
                </AlertDialog.Description>
              </YStack>

              {/* Scope Selection */}
              <YStack gap="$3">
                <SizableText size="$4" fontWeight="600">
                  Select Scopes
                </SizableText>
                <YStack gap="$2" maxHeight={300} overflow="scroll">
                  {scopes.map((scope) => (
                    <XStack key={scope.id} gap="$2" alignItems="center">
                      <Checkbox
                        checked={selectedScopes.includes(scope.scope)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedScopes([...selectedScopes, scope.scope])
                          } else {
                            setSelectedScopes(selectedScopes.filter((s) => s !== scope.scope))
                          }
                        }}
                      />
                      <YStack flex={1}>
                        <SizableText size="$3" fontWeight="600">
                          {scope.display_name}
                        </SizableText>
                        <SizableText size="$2" color="$color11">
                          {scope.description}
                        </SizableText>
                      </YStack>
                    </XStack>
                  ))}
                </YStack>
              </YStack>

              {/* Trust Level */}
              <YStack gap="$3">
                <SizableText size="$4" fontWeight="600">
                  Trust Level
                </SizableText>
                <XStack gap="$2">
                  <Button
                    variant={trustLevel === 'active' ? 'default' : 'outlined'}
                    onPress={() => setTrustLevel('active')}
                    flex={1}
                  >
                    Active
                  </Button>
                  <Button
                    variant={trustLevel === 'trusted' ? 'default' : 'outlined'}
                    onPress={() => setTrustLevel('trusted')}
                    flex={1}
                  >
                    Trusted
                  </Button>
                </XStack>
                <Paragraph size="$2" color="$color11">
                  {trustLevel === 'active'
                    ? 'Active apps require user consent for each authorization'
                    : 'Trusted apps can skip the consent screen'}
                </Paragraph>
              </YStack>

              {/* Actions */}
              <XStack gap="$3" justifyContent="flex-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="outlined">Cancel</Button>
                </AlertDialog.Cancel>
                <Button
                  onPress={handleApprove}
                  disabled={selectedScopes.length === 0 || approveApp.isPending}
                  loading={approveApp.isPending}
                >
                  Approve Application
                </Button>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

      {/* Reject App Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content>
            <YStack gap="$4">
              <YStack gap="$2">
                <AlertDialog.Title>Reject Application</AlertDialog.Title>
                <AlertDialog.Description>
                  Are you sure you want to reject {app.display_name}? This will set the status to
                  revoked.
                </AlertDialog.Description>
              </YStack>

              <YStack gap="$2">
                <SizableText size="$3">Rejection Reason (Optional)</SizableText>
                <Input
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="e.g., Does not meet security requirements"
                  multiline
                  numberOfLines={3}
                />
              </YStack>

              <XStack gap="$3" justifyContent="flex-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="outlined">Cancel</Button>
                </AlertDialog.Cancel>
                <Button
                  onPress={handleReject}
                  disabled={rejectApp.isPending}
                  loading={rejectApp.isPending}
                  backgroundColor="$red10"
                >
                  Reject Application
                </Button>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

      {/* Suspend App Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content>
            <YStack gap="$4">
              <YStack gap="$2">
                <AlertDialog.Title>Suspend Application</AlertDialog.Title>
                <AlertDialog.Description>
                  Are you sure you want to suspend {app.display_name}? This will revoke all active
                  tokens and prevent new authorizations.
                </AlertDialog.Description>
              </YStack>

              <XStack gap="$3" justifyContent="flex-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="outlined">Cancel</Button>
                </AlertDialog.Cancel>
                <Button
                  onPress={handleSuspend}
                  disabled={suspendApp.isPending}
                  loading={suspendApp.isPending}
                  backgroundColor="$orange10"
                >
                  Suspend Application
                </Button>
              </XStack>
            </YStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </YStack>
  )
}
