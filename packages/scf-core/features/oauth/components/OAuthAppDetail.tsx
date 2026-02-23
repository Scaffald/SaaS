/**
 * OAuth App Detail Component
 * Admin OAuth app detail and approval
 */

import {
  Badge,
  Button,
  Card,
  Paragraph,
  SizableText,
  Row,
  Stack,
  Separator,
  Checkbox,
  AlertDialog,
  Input,
} from '@scaffald/ui'
import { useState } from 'react'
import {
  useAdminOAuthAppDetail,
  useAdminOAuthScopes,
  useAdminApproveAppMutation,
  useAdminRejectAppMutation,
  useAdminSuspendAppMutation,
} from '@scf/core/utils/oauth-sdk-hooks'
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
  const appQuery = useAdminOAuthAppDetail(appId)
  const scopesQuery = useAdminOAuthScopes()

  // Mutations
  const approveApp = useAdminApproveAppMutation({
    onSuccess: () => {
      appQuery.refetch()
      setShowApproveDialog(false)
    },
  })

  const rejectApp = useAdminRejectAppMutation({
    onSuccess: () => {
      appQuery.refetch()
      setShowRejectDialog(false)
      router.push(ROUTES.OFFICE.OAUTH_APPS.path)
    },
  })

  const suspendApp = useAdminSuspendAppMutation({
    onSuccess: () => {
      appQuery.refetch()
      setShowSuspendDialog(false)
    },
  })

  const app = appQuery.data?.app
  const scopes = scopesQuery.data?.scopes || []

  if (appQuery.isLoading) {
    return (
      <Stack flex={1} padding="md" gap={16}>
        <SizableText>Loading...</SizableText>
      </Stack>
    )
  }

  if (!app) {
    return (
      <Stack flex={1} padding="md" gap={16}>
        <SizableText>App not found</SizableText>
      </Stack>
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
    <Stack flex={1} gap={16} data-testid="oauth-app-detail">
      {/* Header */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={8} flex={1}>
          <SizableText size={24} data-testid="oauth-app-detail-name">
            {app.display_name}
          </SizableText>
          <Row gap={8} align="center">
            <Badge
              backgroundColor={statusColor}
              color="white"
              data-testid="oauth-app-detail-status"
            >
              {app.status.toUpperCase()}
            </Badge>
            {app.requires_approval && isPending && (
              <Badge
                backgroundColor="$blue10"
                color="white"
                data-testid="oauth-app-requires-approval"
              >
                REQUIRES APPROVAL
              </Badge>
            )}
          </Row>
        </Stack>

        {/* Action Buttons */}
        <Row gap={8} data-testid="oauth-app-actions">
          {isPending && (
            <>
              <Button
                variant="outline"
                onPress={() => setShowRejectDialog(true)}
                data-testid="oauth-app-reject-button"
              >
                Reject
              </Button>
              <Button
                onPress={() => setShowApproveDialog(true)}
                data-testid="oauth-app-approve-button"
              >
                Approve
              </Button>
            </>
          )}
          {isActive && (
            <Button
              variant="outline"
              onPress={() => setShowSuspendDialog(true)}
              data-testid="oauth-app-suspend-button"
            >
              Suspend
            </Button>
          )}
        </Row>
      </Row>

      {/* App Details */}
      <Card padding="md" gap={16}>
        <Stack gap={12}>
          <SizableText size="lg">Application Details</SizableText>

          <Stack gap={8}>
            <SizableText size="sm" color="$gray11">
              Description
            </SizableText>
            <Paragraph size="sm">{app.description || 'No description provided'}</Paragraph>
          </Stack>

          <Separator />

          <Stack gap={8}>
            <SizableText size="sm" color="$gray11">
              Client ID
            </SizableText>
            <SizableText size="sm" fontFamily="$mono" data-testid="oauth-app-client-id">
              {app.client_id}
            </SizableText>
          </Stack>

          <Stack gap={8}>
            <SizableText size="sm" color="$gray11">
              Homepage URL
            </SizableText>
            <SizableText size="sm" color="$blue10">
              {app.homepage_url || 'Not provided'}
            </SizableText>
          </Stack>

          {app.privacy_policy_url && (
            <Stack gap={8}>
              <SizableText size="sm" color="$gray11">
                Privacy Policy URL
              </SizableText>
              <SizableText size="sm" color="$blue10">
                {app.privacy_policy_url}
              </SizableText>
            </Stack>
          )}

          {app.terms_of_service_url && (
            <Stack gap={8}>
              <SizableText size="sm" color="$gray11">
                Terms of Service URL
              </SizableText>
              <SizableText size="sm" color="$blue10">
                {app.terms_of_service_url}
              </SizableText>
            </Stack>
          )}

          <Separator />

          <Stack gap={8}>
            <SizableText size="sm" color="$gray11">
              Owner Email
            </SizableText>
            <SizableText size="sm">{app.owner_email || 'Not provided'}</SizableText>
          </Stack>

          <Stack gap={8}>
            <SizableText size="sm" color="$gray11">
              Created
            </SizableText>
            <SizableText size="sm">{new Date(app.created_at).toLocaleString()}</SizableText>
          </Stack>

          {app.approved_at && (
            <Stack gap={8}>
              <SizableText size="sm" color="$gray11">
                Approved
              </SizableText>
              <SizableText size="sm">{new Date(app.approved_at).toLocaleString()}</SizableText>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Redirect URIs */}
      <Card padding="md" gap={16} data-testid="oauth-app-redirect-uris">
        <Stack gap={12}>
          <SizableText size="lg">Redirect URIs</SizableText>
          <Stack gap={8}>
            {app.redirect_uris.map((uri, index) => (
              <Stack key={index} gap={4}>
                <SizableText
                  size="sm"
                  fontFamily="$mono"
                  color="$blue10"
                  data-testid={`oauth-app-redirect-uri-${index}`}
                >
                  {uri}
                </SizableText>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Card>

      {/* Allowed Scopes */}
      <Card padding="md" gap={16} data-testid="oauth-app-scopes">
        <Stack gap={12}>
          <SizableText size="lg">Allowed Scopes</SizableText>
          {app.allowed_scopes.length > 0 ? (
            <Row gap={8} wrap>
              {app.allowed_scopes.map((scope) => (
                <Badge
                  key={scope}
                  backgroundColor="$blue2"
                  color="$blue10"
                  data-testid={`oauth-app-scope-${scope}`}
                >
                  {scope}
                </Badge>
              ))}
            </Row>
          ) : (
            <Paragraph size="sm" color="$gray11" data-testid="oauth-app-no-scopes">
              No scopes approved yet
            </Paragraph>
          )}
        </Stack>
      </Card>

      {/* Approve App Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content maxWidth={600}>
            <Stack gap={16}>
              <Stack gap={8}>
                <AlertDialog.Title>Approve OAuth Application</AlertDialog.Title>
                <AlertDialog.Description>
                  Select the scopes to grant and the trust level for {app.display_name}.
                </AlertDialog.Description>
              </Stack>

              {/* Scope Selection */}
              <Stack gap={12}>
                <SizableText size="md">Select Scopes</SizableText>
                <Stack gap={8} maxHeight={300} overflow="scroll">
                  {scopes.map((scope) => (
                    <Row key={scope.id} gap={8} align="center">
                      <Checkbox
                        checked={selectedScopes.includes(scope.scope)}
                        onChange={(checked) => {
                          if (checked) {
                            setSelectedScopes([...selectedScopes, scope.scope])
                          } else {
                            setSelectedScopes(selectedScopes.filter((s) => s !== scope.scope))
                          }
                        }}
                      />
                      <Stack flex={1}>
                        <SizableText size="sm">{scope.display_name}</SizableText>
                        <SizableText size="sm" color="$gray11">
                          {scope.description}
                        </SizableText>
                      </Stack>
                    </Row>
                  ))}
                </Stack>
              </Stack>

              {/* Trust Level */}
              <Stack gap={12}>
                <SizableText size="md">Trust Level</SizableText>
                <Row gap={8}>
                  <Button
                    variant={trustLevel === 'active' ? 'default' : 'outline'}
                    onPress={() => setTrustLevel('active')}
                    flex={1}
                  >
                    Active
                  </Button>
                  <Button
                    variant={trustLevel === 'trusted' ? 'default' : 'outline'}
                    onPress={() => setTrustLevel('trusted')}
                    flex={1}
                  >
                    Trusted
                  </Button>
                </Row>
                <Paragraph size="sm" color="$gray11">
                  {trustLevel === 'active'
                    ? 'Active apps require user consent for each authorization'
                    : 'Trusted apps can skip the consent screen'}
                </Paragraph>
              </Stack>

              {/* Actions */}
              <Row gap={12} justify="flex-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialog.Cancel>
                <Button
                  onPress={handleApprove}
                  disabled={selectedScopes.length === 0 || approveApp.isPending}
                  loading={approveApp.isPending}
                >
                  Approve Application
                </Button>
              </Row>
            </Stack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

      {/* Reject App Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content>
            <Stack gap={16}>
              <Stack gap={8}>
                <AlertDialog.Title>Reject Application</AlertDialog.Title>
                <AlertDialog.Description>
                  Are you sure you want to reject {app.display_name}? This will set the status to
                  revoked.
                </AlertDialog.Description>
              </Stack>

              <Stack gap={8}>
                <SizableText size="sm">Rejection Reason (Optional)</SizableText>
                <Input
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="e.g., Does not meet security requirements"
                  multiline
                />
              </Stack>

              <Row gap={12} justify="flex-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialog.Cancel>
                <Button
                  onPress={handleReject}
                  disabled={rejectApp.isPending}
                  loading={rejectApp.isPending}
                  backgroundColor="$red10"
                >
                  Reject Application
                </Button>
              </Row>
            </Stack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

      {/* Suspend App Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content>
            <Stack gap={16}>
              <Stack gap={8}>
                <AlertDialog.Title>Suspend Application</AlertDialog.Title>
                <AlertDialog.Description>
                  Are you sure you want to suspend {app.display_name}? This will revoke all active
                  tokens and prevent new authorizations.
                </AlertDialog.Description>
              </Stack>

              <Row gap={12} justify="flex-end">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialog.Cancel>
                <Button
                  onPress={handleSuspend}
                  disabled={suspendApp.isPending}
                  loading={suspendApp.isPending}
                  backgroundColor="$orange10"
                >
                  Suspend Application
                </Button>
              </Row>
            </Stack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </Stack>
  )
}
