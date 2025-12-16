/**
 * REQ-6: CCPA Admin OAuth Apps List Page
 * TASK-5: Build OAuth App CCPA Configuration Management Pages
 *
 * Lists all OAuth apps with their CCPA integration status:
 * - Not Configured
 * - Partially Configured
 * - Compliant
 */

'use client'

import { useCallback } from 'react'
import { YStack, XStack, Text, Button, Card, H2, Spinner } from '@unicornlove/ui'
import { useRouter } from 'next/navigation'
import { trpc } from '../../../../../lib/trpc'

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  not_configured: { bg: '$gray2', text: '$gray11' },
  partially_configured: { bg: '$yellow2', text: '$yellow11' },
  compliant: { bg: '$green2', text: '$green11' },
}

const STATUS_LABELS: Record<string, string> = {
  not_configured: 'Not Configured',
  partially_configured: 'Partially Configured',
  compliant: 'Compliant',
}

const APP_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '$green2', text: '$green11' },
  suspended: { bg: '$orange2', text: '$orange11' },
  revoked: { bg: '$red2', text: '$red11' },
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
      <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
        <YStack alignItems="center" justifyContent="center" minHeight={400}>
          <Spinner size="large" />
          <Text color="$gray11" marginTop="$4">
            Loading OAuth apps...
          </Text>
        </YStack>
      </YStack>
    )
  }

  // Error state
  if (error) {
    return (
      <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
        <YStack
          padding="$4"
          backgroundColor="$red2"
          borderWidth={1}
          borderColor="$red6"
          borderRadius="$4"
        >
          <Text fontWeight="600" color="$red11">
            Error loading OAuth apps
          </Text>
          <Text color="$red10" fontSize="$2" marginTop="$2">
            {error.message || 'Failed to load data. Please try again.'}
          </Text>
          <Button
            marginTop="$3"
            size="$3"
            backgroundColor="$red9"
            color="white"
            hoverStyle={{ backgroundColor: '$red10' }}
            onPress={() => refetch()}
          >
            Retry
          </Button>
        </YStack>
      </YStack>
    )
  }

  // Calculate summary stats
  const compliantCount = apps?.filter((a) => a.ccpaStatus === 'compliant').length ?? 0
  const partialCount = apps?.filter((a) => a.ccpaStatus === 'partially_configured').length ?? 0
  const notConfiguredCount = apps?.filter((a) => a.ccpaStatus === 'not_configured').length ?? 0
  const totalApps = apps?.length ?? 0

  return (
    <YStack padding="$6" maxWidth={1400} marginHorizontal="auto">
      {/* Header */}
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <YStack>
          <H2 marginBottom="$2">OAuth App CCPA Configuration</H2>
          <Text color="$gray11">
            Configure CCPA compliance settings for registered OAuth applications
          </Text>
        </YStack>
        <Button
          backgroundColor="$gray3"
          color="$gray11"
          hoverStyle={{ backgroundColor: '$gray4' }}
          onPress={() => router.push('/admin/ccpa')}
        >
          Back to Dashboard
        </Button>
      </XStack>

      {/* Summary Stats */}
      <XStack gap="$4" marginBottom="$6" flexWrap="wrap">
        <Card padding="$4" flex={1} minWidth={200}>
          <Text color="$gray11" fontSize="$2" marginBottom="$1">
            Total Apps
          </Text>
          <Text fontSize="$8" fontWeight="700" color="$gray12">
            {totalApps}
          </Text>
        </Card>
        <Card padding="$4" flex={1} minWidth={200}>
          <Text color="$gray11" fontSize="$2" marginBottom="$1">
            Compliant
          </Text>
          <Text fontSize="$8" fontWeight="700" color="$green11">
            {compliantCount}
          </Text>
        </Card>
        <Card padding="$4" flex={1} minWidth={200}>
          <Text color="$gray11" fontSize="$2" marginBottom="$1">
            Partially Configured
          </Text>
          <Text fontSize="$8" fontWeight="700" color="$yellow11">
            {partialCount}
          </Text>
        </Card>
        <Card padding="$4" flex={1} minWidth={200}>
          <Text color="$gray11" fontSize="$2" marginBottom="$1">
            Not Configured
          </Text>
          <Text fontSize="$8" fontWeight="700" color="$gray11">
            {notConfiguredCount}
          </Text>
        </Card>
      </XStack>

      {/* Apps Table */}
      <Card overflow="hidden">
        <YStack>
          {/* Table Header */}
          <XStack backgroundColor="$gray2" paddingHorizontal="$4" paddingVertical="$3">
            <Text flex={2} fontSize="$2" fontWeight="500" color="$gray11">
              Application
            </Text>
            <Text width={120} fontSize="$2" fontWeight="500" color="$gray11">
              Status
            </Text>
            <Text width={150} fontSize="$2" fontWeight="500" color="$gray11">
              CCPA Status
            </Text>
            <Text width={180} fontSize="$2" fontWeight="500" color="$gray11">
              Last Verified
            </Text>
            <Text width={120} fontSize="$2" fontWeight="500" color="$gray11">
              Actions
            </Text>
          </XStack>

          {/* Table Body */}
          {!apps || apps.length === 0 ? (
            <YStack padding="$8" alignItems="center">
              <Text fontSize="$6" color="$gray8" marginBottom="$2">
                No OAuth apps registered
              </Text>
              <Text color="$gray11" textAlign="center">
                Register OAuth applications to enable CCPA compliance integration.
              </Text>
            </YStack>
          ) : (
            <YStack>
              {apps.map((app) => (
                <XStack
                  key={app.id}
                  paddingHorizontal="$4"
                  paddingVertical="$3"
                  borderBottomWidth={1}
                  borderColor="$borderColor"
                  hoverStyle={{ backgroundColor: '$gray2' }}
                  alignItems="center"
                >
                  {/* Application */}
                  <YStack flex={2}>
                    <Text fontWeight="500" color="$gray12">
                      {app.displayName}
                    </Text>
                    <Text fontSize="$2" color="$gray11">
                      {app.description || app.name}
                    </Text>
                  </YStack>

                  {/* Status */}
                  <XStack width={120} alignItems="center">
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      backgroundColor={APP_STATUS_COLORS[app.status]?.bg ?? '$gray2'}
                    >
                      <Text fontSize="$2" color={APP_STATUS_COLORS[app.status]?.text ?? '$gray11'}>
                        {app.status}
                      </Text>
                    </XStack>
                  </XStack>

                  {/* CCPA Status */}
                  <XStack width={150} alignItems="center">
                    <XStack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                      backgroundColor={STATUS_COLORS[app.ccpaStatus]?.bg ?? '$gray2'}
                    >
                      <Text fontSize="$2" color={STATUS_COLORS[app.ccpaStatus]?.text ?? '$gray11'}>
                        {STATUS_LABELS[app.ccpaStatus] ?? app.ccpaStatus}
                      </Text>
                    </XStack>
                  </XStack>

                  {/* Last Verified */}
                  <XStack width={180} alignItems="center">
                    <Text fontSize="$2" color="$gray11">
                      {formatDate(app.lastVerifiedAt)}
                    </Text>
                  </XStack>

                  {/* Actions */}
                  <XStack width={120} alignItems="center">
                    <Button
                      size="$2"
                      backgroundColor="$blue9"
                      color="white"
                      hoverStyle={{ backgroundColor: '$blue10' }}
                      onPress={() => router.push(`/admin/ccpa/apps/${app.id}`)}
                    >
                      Configure
                    </Button>
                  </XStack>
                </XStack>
              ))}
            </YStack>
          )}
        </YStack>
      </Card>

      {/* Help Text */}
      <Card padding="$4" marginTop="$6" backgroundColor="$blue2" borderWidth={1} borderColor="$blue6">
        <Text fontWeight="500" color="$blue11" marginBottom="$2">
          About CCPA Configuration
        </Text>
        <Text color="$blue10" fontSize="$2">
          Each OAuth application that handles personal data must be configured for CCPA compliance.
          This includes defining data categories, webhook endpoints for processing requests, and
          testing the integration to ensure proper handling of access, deletion, and opt-out
          requests.
        </Text>
      </Card>
    </YStack>
  )
}
