/**
 * OAuth App Detail Component
 * Admin OAuth app detail and approval
 */

import {
  Button,
  Card,
  Chip,
  Paragraph,
  Text,
  Row,
  Stack,
  Separator,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalActions,
  Input,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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
        <Text>Loading...</Text>
      </Stack>
    )
  }

  if (!app) {
    return (
      <Stack flex={1} padding="md" gap={16}>
        <Text>App not found</Text>
      </Stack>
    )
  }

  const isPending = app.status === 'pending'
  const isActive = app.status === 'active' || app.status === 'trusted'
  const _isRevoked = app.status === 'revoked'

  const statusColor =
    app.status === 'active' || app.status === 'trusted'
      ? colors.success[500]
      : app.status === 'pending'
        ? colors.warning[500]
        : app.status === 'suspended'
          ? colors.warning[500]
          : colors.error[600]

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
          <Text size="2xl" data-testid="oauth-app-detail-name">
            {app.display_name}
          </Text>
          <Row gap={8} align="center">
            <Chip
              style={{ backgroundColor: statusColor }}
              textStyle={{ color: 'white' }}
              data-testid="oauth-app-detail-status"
            >
              {app.status.toUpperCase()}
            </Chip>
            {app.requires_approval && isPending && (
              <Chip
                style={{ backgroundColor: colors.info[600] }}
                textStyle={{ color: 'white' }}
                data-testid="oauth-app-requires-approval"
              >
                REQUIRES APPROVAL
              </Chip>
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
      <Card variant="glass" padding="md">
        <Stack gap={16}>
        <Stack gap={12}>
          <Text size="lg">Application Details</Text>

          <Stack gap={8}>
            <Text size="sm" color={colors.text[t].secondary}>
              Description
            </Text>
            <Paragraph size="sm">{app.description || 'No description provided'}</Paragraph>
          </Stack>

          <Separator />

          <Stack gap={8}>
            <Text size="sm" color={colors.text[t].secondary}>
              Client ID
            </Text>
            <Text size="sm" mono data-testid="oauth-app-client-id">
              {app.client_id}
            </Text>
          </Stack>

          <Stack gap={8}>
            <Text size="sm" color={colors.text[t].secondary}>
              Homepage URL
            </Text>
            <Text size="sm" color={t === 'dark' ? colors.blue[300] : colors.blue[600]}>
              {app.homepage_url || 'Not provided'}
            </Text>
          </Stack>

          {app.privacy_policy_url && (
            <Stack gap={8}>
              <Text size="sm" color={colors.text[t].secondary}>
                Privacy Policy URL
              </Text>
              <Text size="sm" color={t === 'dark' ? colors.blue[300] : colors.blue[600]}>
                {app.privacy_policy_url}
              </Text>
            </Stack>
          )}

          {app.terms_of_service_url && (
            <Stack gap={8}>
              <Text size="sm" color={colors.text[t].secondary}>
                Terms of Service URL
              </Text>
              <Text size="sm" color={t === 'dark' ? colors.blue[300] : colors.blue[600]}>
                {app.terms_of_service_url}
              </Text>
            </Stack>
          )}

          <Separator />

          <Stack gap={8}>
            <Text size="sm" color={colors.text[t].secondary}>
              Owner Email
            </Text>
            <Text size="sm">{app.owner_email || 'Not provided'}</Text>
          </Stack>

          <Stack gap={8}>
            <Text size="sm" color={colors.text[t].secondary}>
              Created
            </Text>
            <Text size="sm">{new Date(app.created_at).toLocaleString()}</Text>
          </Stack>

          {app.approved_at && (
            <Stack gap={8}>
              <Text size="sm" color={colors.text[t].secondary}>
                Approved
              </Text>
              <Text size="sm">{new Date(app.approved_at).toLocaleString()}</Text>
            </Stack>
          )}
        </Stack>
        </Stack>
      </Card>

      {/* Redirect URIs */}
      <Card variant="glass" padding="md" data-testid="oauth-app-redirect-uris">
        <Stack gap={16}>
        <Stack gap={12}>
          <Text size="lg">Redirect URIs</Text>
          <Stack gap={8}>
            {app.redirect_uris.map((uri, index) => (
              <Stack key={index} gap={4}>
                <Text
                  size="sm"
                  mono
                  color={t === 'dark' ? colors.blue[300] : colors.blue[600]}
                  data-testid={`oauth-app-redirect-uri-${index}`}
                >
                  {uri}
                </Text>
              </Stack>
            ))}
          </Stack>
        </Stack>
        </Stack>
      </Card>

      {/* Allowed Scopes */}
      <Card variant="glass" padding="md" data-testid="oauth-app-scopes">
        <Stack gap={16}>
        <Stack gap={12}>
          <Text size="lg">Allowed Scopes</Text>
          {app.allowed_scopes.length > 0 ? (
            <Row gap={8} wrap>
              {app.allowed_scopes.map((scope) => (
                <Chip
                  key={scope}
                  style={{ backgroundColor: t === 'dark' ? colors.info[900] : colors.info[100], paddingHorizontal: 8, paddingVertical: 4 }}
                  textStyle={{ color: colors.info[700] }}
                  data-testid={`oauth-app-scope-${scope}`}
                >
                  {scope}
                </Chip>
              ))}
            </Row>
          ) : (
            <Paragraph size="sm" color={colors.text[t].secondary} data-testid="oauth-app-no-scopes">
              No scopes approved yet
            </Paragraph>
          )}
        </Stack>
        </Stack>
      </Card>

      {/* Approve App Dialog */}
      <Modal visible={showApproveDialog} onClose={() => setShowApproveDialog(false)} width={600}>
        <ModalContent>
          <ModalHeader
            title="Approve OAuth Application"
            description={`Select the scopes to grant and the trust level for ${app.display_name}.`}
            onClose={() => setShowApproveDialog(false)}
          />
          <Stack gap={16}>
              {/* Scope Selection */}
              <Stack gap={12}>
                <Text size="md">Select Scopes</Text>
                <Stack gap={8} style={{ maxHeight: 300, overflow: 'scroll' }}>
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
                        <Text size="sm">{scope.display_name}</Text>
                        <Text size="sm" color={colors.text[t].secondary}>
                          {scope.description}
                        </Text>
                      </Stack>
                    </Row>
                  ))}
                </Stack>
              </Stack>

              {/* Trust Level */}
              <Stack gap={12}>
                <Text size="md">Trust Level</Text>
                <Row gap={8}>
                  <Button
                    variant={trustLevel === 'active' ? 'filled' : 'outline'}
                    onPress={() => setTrustLevel('active')}
                    style={{ flex: 1 }}
                  >
                    Active
                  </Button>
                  <Button
                    variant={trustLevel === 'trusted' ? 'filled' : 'outline'}
                    onPress={() => setTrustLevel('trusted')}
                    style={{ flex: 1 }}
                  >
                    Trusted
                  </Button>
                </Row>
                <Paragraph size="sm" color={colors.text[t].secondary}>
                  {trustLevel === 'active'
                    ? 'Active apps require user consent for each authorization'
                    : 'Trusted apps can skip the consent screen'}
                </Paragraph>
              </Stack>

              <ModalActions
                primaryAction={{
                  label: 'Approve Application',
                  onPress: handleApprove,
                  disabled: selectedScopes.length === 0 || approveApp.isPending,
                  loading: approveApp.isPending,
                }}
                secondaryAction={{
                  label: 'Cancel',
                  onPress: () => setShowApproveDialog(false),
                  variant: 'outline',
                }}
              />
            </Stack>
        </ModalContent>
      </Modal>

      {/* Reject App Dialog */}
      <Modal visible={showRejectDialog} onClose={() => setShowRejectDialog(false)}>
        <ModalContent>
          <ModalHeader
            title="Reject Application"
            description={`Are you sure you want to reject ${app.display_name}? This will set the status to revoked.`}
            onClose={() => setShowRejectDialog(false)}
          />
          <Stack gap={16}>
              <Stack gap={8}>
                <Text size="sm">Rejection Reason (Optional)</Text>
                <Input
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="e.g., Does not meet security requirements"
                  multiline
                />
              </Stack>

              <ModalActions
                primaryAction={{
                  label: 'Reject Application',
                  onPress: handleReject,
                  disabled: rejectApp.isPending,
                  loading: rejectApp.isPending,
                  color: 'error',
                }}
                secondaryAction={{
                  label: 'Cancel',
                  onPress: () => setShowRejectDialog(false),
                  variant: 'outline',
                }}
              />
            </Stack>
        </ModalContent>
      </Modal>

      {/* Suspend App Dialog */}
      <Modal visible={showSuspendDialog} onClose={() => setShowSuspendDialog(false)}>
        <ModalContent>
          <ModalHeader
            title="Suspend Application"
            description={`Are you sure you want to suspend ${app.display_name}? This will revoke all active tokens and prevent new authorizations.`}
            onClose={() => setShowSuspendDialog(false)}
          />
          <Stack gap={16}>
              <ModalActions
                primaryAction={{
                  label: 'Suspend Application',
                  onPress: handleSuspend,
                  disabled: suspendApp.isPending,
                  loading: suspendApp.isPending,
                  color: 'error',
                }}
                secondaryAction={{
                  label: 'Cancel',
                  onPress: () => setShowSuspendDialog(false),
                  variant: 'outline',
                }}
              />
            </Stack>
        </ModalContent>
      </Modal>
    </Stack>
  )
}
