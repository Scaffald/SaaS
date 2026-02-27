/**
 * CCPA Admin OAuth Apps List Page
 * TASK-5: Build OAuth App CCPA Configuration Management Pages
 *
 * Lists all OAuth apps with their CCPA integration status:
 * - Not Configured
 * - Partially Configured
 * - Compliant
 */

'use client'

import { useCallback } from 'react'
import { Stack, Row, Text, Button, Card, Heading, Spinner, colors, spacing } from '@scaffald/ui'
import { useRouter } from 'next/navigation'
import { trpc } from '../../../../../lib/trpc'

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  not_configured: { bg: colors.gray[100], text: colors.text.light.secondary },
  partially_configured: { bg: colors.warning[200], text: colors.warning[600] },
  compliant: { bg: colors.success[200], text: colors.success[600] },
}

const STATUS_LABELS: Record<string, string> = {
  not_configured: 'Not Configured',
  partially_configured: 'Partially Configured',
  compliant: 'Compliant',
}

const APP_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: colors.success[200], text: colors.success[600] },
  suspended: { bg: colors.warning[200], text: colors.warning[600] },
  revoked: { bg: colors.error[200], text: colors.error[600] },
}

export default function CCPAAppsListPage() {
  const router = useRouter()

  // Fetch OAuth apps with CCPA status
  const {
    data: apps,
    isLoading,
    error,
    refetch,
  } = trpc.ccpaAdmin.listApps.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
  })

  // Helpers
  const formatDate = useCallback((dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
        <Stack style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <Spinner size="lg" />
          <Text color={colors.text.light.secondary} style={{ marginTop: spacing[16] }}>
            Loading OAuth apps...
          </Text>
        </Stack>
      </Stack>
    )
  }

  // Error state
  if (error) {
    return (
      <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
        <Stack
          style={{
            padding: spacing[16],
            backgroundColor: colors.error[200],
            borderWidth: 1,
            borderColor: colors.error[400],
            borderRadius: spacing[16],
          }}
        >
          <Text weight="semibold" color={colors.error[600]}>
            Error loading OAuth apps
          </Text>
          <Text color={colors.error[500]} size="xs" style={{ marginTop: spacing[8] }}>
            {error.message || 'Failed to load data. Please try again.'}
          </Text>
          <Button
            style={{ marginTop: spacing[12] }}
            size="sm"
            color="error"
            variant="filled"
            onPress={() => refetch()}
          >
            Retry
          </Button>
        </Stack>
      </Stack>
    )
  }

  // Calculate summary stats
  const compliantCount = apps?.filter((a) => a.ccpaStatus === 'compliant').length ?? 0
  const partialCount = apps?.filter((a) => a.ccpaStatus === 'partially_configured').length ?? 0
  const notConfiguredCount = apps?.filter((a) => a.ccpaStatus === 'not_configured').length ?? 0
  const totalApps = apps?.length ?? 0

  return (
    <Stack style={{ padding: spacing[24], maxWidth: 1400, marginHorizontal: 'auto' }}>
      {/* Header */}
      <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: spacing[24] }}>
        <Stack>
          <Heading level={2} style={{ marginBottom: spacing[8] }}>OAuth App CCPA Configuration</Heading>
          <Text color={colors.text.light.secondary}>
            Configure CCPA compliance settings for registered OAuth applications
          </Text>
        </Stack>
        <Button
          variant="outline"
          color="gray"
          onPress={() => router.push('/admin/ccpa')}
        >
          Back to Dashboard
        </Button>
      </Row>

      {/* Summary Stats */}
      <Row gap={spacing[16]} style={{ marginBottom: spacing[24], flexWrap: 'wrap' }}>
        <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
          <Text color={colors.text.light.secondary} size="xs" style={{ marginBottom: spacing[4] }}>
            Total Apps
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.text.light.primary}>
            {totalApps}
          </Text>
        </Card>
        <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
          <Text color={colors.text.light.secondary} size="xs" style={{ marginBottom: spacing[4] }}>
            Compliant
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.success[600]}>
            {compliantCount}
          </Text>
        </Card>
        <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
          <Text color={colors.text.light.secondary} size="xs" style={{ marginBottom: spacing[4] }}>
            Partially Configured
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.warning[600]}>
            {partialCount}
          </Text>
        </Card>
        <Card style={{ padding: spacing[16], flex: 1, minWidth: 200 }}>
          <Text color={colors.text.light.secondary} size="xs" style={{ marginBottom: spacing[4] }}>
            Not Configured
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700' }} color={colors.text.light.secondary}>
            {notConfiguredCount}
          </Text>
        </Card>
      </Row>

      {/* Apps Table */}
      <Card style={{ overflow: 'hidden' }}>
        <Stack>
          {/* Table Header */}
          <Row style={{ backgroundColor: colors.gray[100], paddingHorizontal: spacing[16], paddingVertical: spacing[12] }}>
            <Text style={{ flex: 2 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Application
            </Text>
            <Text style={{ width: 120 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Status
            </Text>
            <Text style={{ width: 150 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              CCPA Status
            </Text>
            <Text style={{ width: 180 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Last Verified
            </Text>
            <Text style={{ width: 120 }} size="xs" weight="medium" color={colors.text.light.secondary}>
              Actions
            </Text>
          </Row>

          {/* Table Body */}
          {!apps || apps.length === 0 ? (
            <Stack style={{ padding: spacing[32], alignItems: 'center' }}>
              <Text style={{ fontSize: 24 }} color={colors.gray[300]} style={{ marginBottom: spacing[8] }}>
                No OAuth apps registered
              </Text>
              <Text color={colors.text.light.secondary} style={{ textAlign: 'center' }}>
                Register OAuth applications to enable CCPA compliance integration.
              </Text>
            </Stack>
          ) : (
            <Stack>
              {apps.map((app) => (
                <Row
                  key={app.id}
                  style={{
                    paddingHorizontal: spacing[16],
                    paddingVertical: spacing[12],
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.light.default,
                    alignItems: 'center',
                  }}
                >
                  {/* Application */}
                  <Stack style={{ flex: 2 }}>
                    <Text weight="medium" color={colors.text.light.primary}>
                      {app.displayName}
                    </Text>
                    <Text size="xs" color={colors.text.light.secondary}>
                      {app.description || app.name}
                    </Text>
                  </Stack>

                  {/* Status */}
                  <Row style={{ width: 120, alignItems: 'center' }}>
                    <Row
                      style={{
                        paddingHorizontal: spacing[8],
                        paddingVertical: spacing[4],
                        borderRadius: 8,
                        backgroundColor: APP_STATUS_COLORS[app.status]?.bg ?? colors.gray[100],
                      }}
                    >
                      <Text size="xs" color={APP_STATUS_COLORS[app.status]?.text ?? colors.text.light.secondary}>
                        {app.status}
                      </Text>
                    </Row>
                  </Row>

                  {/* CCPA Status */}
                  <Row style={{ width: 150, alignItems: 'center' }}>
                    <Row
                      style={{
                        paddingHorizontal: spacing[8],
                        paddingVertical: spacing[4],
                        borderRadius: 8,
                        backgroundColor: STATUS_COLORS[app.ccpaStatus]?.bg ?? colors.gray[100],
                      }}
                    >
                      <Text size="xs" color={STATUS_COLORS[app.ccpaStatus]?.text ?? colors.text.light.secondary}>
                        {STATUS_LABELS[app.ccpaStatus] ?? app.ccpaStatus}
                      </Text>
                    </Row>
                  </Row>

                  {/* Last Verified */}
                  <Row style={{ width: 180, alignItems: 'center' }}>
                    <Text size="xs" color={colors.text.light.secondary}>
                      {formatDate(app.lastVerifiedAt)}
                    </Text>
                  </Row>

                  {/* Actions */}
                  <Row style={{ width: 120, alignItems: 'center' }}>
                    <Button
                      size="xs"
                      color="primary"
                      variant="filled"
                      onPress={() => router.push(`/admin/ccpa/apps/${app.id}`)}
                    >
                      Configure
                    </Button>
                  </Row>
                </Row>
              ))}
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Help Text */}
      <Card style={{ padding: spacing[16], marginTop: spacing[24], backgroundColor: colors.info[200], borderWidth: 1, borderColor: colors.info[400] }}>
        <Text weight="medium" color={colors.info[600]} style={{ marginBottom: spacing[8] }}>
          About CCPA Configuration
        </Text>
        <Text color={colors.info[500]} size="xs">
          Each OAuth application that handles personal data must be configured for CCPA compliance.
          This includes defining data categories, webhook endpoints for processing requests, and
          testing the integration to ensure proper handling of access, deletion, and opt-out
          requests.
        </Text>
      </Card>
    </Stack>
  )
}
