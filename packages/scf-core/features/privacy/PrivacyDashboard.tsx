/**
 * Privacy Dashboard - Main CCPA Privacy Management Page
 * REQ-3: CCPA Compliance Implementation
 *
 * User-facing dashboard for:
 * - Viewing data categories collected
 * - Understanding CCPA rights
 * - Viewing request history
 * - Managing connected OAuth apps
 * - Quick actions for data requests and opt-outs
 */

import { useState } from 'react'
import { Button, ScrollView, Spinner, Text, XStack, YStack } from '@unicornlove/ui'
import { api } from '@scf/core/utils/api'
import { DataCategorySummary } from './components/DataCategorySummary'
import { PrivacyRightsList } from './components/PrivacyRightsList'
import { RequestHistoryTable } from './components/RequestHistoryTable'
import { ConnectedAppsPanel } from './components/ConnectedAppsPanel'

/**
 * Main Privacy Dashboard component
 */
export function PrivacyDashboard() {
  const [_showRequestForm, setShowRequestForm] = useState(false)
  const [_showOptOutManager, setShowOptOutManager] = useState(false)

  // Fetch user's data summary
  const {
    data: dataSummary,
    isLoading: isLoadingData,
    error: dataError,
  } = api.ccpa.getDataSummary.useQuery()

  // Fetch request history
  const {
    data: requestHistory,
    isLoading: isLoadingHistory,
    error: historyError,
  } = api.ccpa.getMyRequests.useQuery({
    limit: 10,
  })

  // Fetch connected OAuth apps
  const {
    data: connectedApps,
    isLoading: isLoadingApps,
    error: appsError,
  } = api.ccpa.getConnectedApps.useQuery()

  // Fetch opt-out status
  const {
    data: optOutStatus,
    isLoading: isLoadingOptOut,
  } = api.ccpa.getMyOptOuts.useQuery()

  const isLoading = isLoadingData || isLoadingHistory || isLoadingApps || isLoadingOptOut
  const hasError = dataError || historyError || appsError

  if (hasError) {
    return (
      <YStack padding="$4" gap="$4" alignItems="center" justifyContent="center" flex={1}>
        <Text color="$red10" fontSize="$5" fontWeight="600">
          Error Loading Privacy Dashboard
        </Text>
        <Text color="$color11" textAlign="center">
          {dataError?.message || historyError?.message || appsError?.message}
        </Text>
        <Button
          onPress={() => window.location.reload()}
          variant="outlined"
        >
          Retry
        </Button>
      </YStack>
    )
  }

  return (
    <ScrollView>
      <YStack padding="$4" gap="$6" maxWidth={1200} marginHorizontal="auto">
        {/* Page Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="700">
            Privacy & Data
          </Text>
          <Text color="$color11" fontSize="$4">
            Manage your privacy settings, view your data, and exercise your California
            Consumer Privacy Act (CCPA) rights.
          </Text>
        </YStack>

        {/* Quick Actions */}
        <YStack
          gap="$4"
          padding="$4"
          backgroundColor="$color2"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text fontSize="$5" fontWeight="600">
            Quick Actions
          </Text>
          <XStack gap="$3" flexWrap="wrap">
            <Button
              onPress={() => setShowRequestForm(true)}
              icon={undefined}
              size="$4"
            >
              Request My Data
            </Button>
            <Button
              onPress={() => setShowRequestForm(true)}
              variant="outlined"
              size="$4"
            >
              Delete My Data
            </Button>
            <Button
              onPress={() => setShowOptOutManager(true)}
              variant="outlined"
              size="$4"
            >
              Manage Opt-Outs
            </Button>
          </XStack>
          {optOutStatus?.hasGPCOptOut && (
            <XStack
              gap="$2"
              padding="$3"
              backgroundColor="$blue2"
              borderRadius="$2"
              alignItems="center"
            >
              <Text fontSize="$3" color="$blue11">
                Your browser&apos;s Global Privacy Control signal has been detected and honored.
                You have been automatically opted out of the sale and sharing of your personal
                information.
              </Text>
            </XStack>
          )}
        </YStack>

        {/* Data Categories Summary */}
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="600">
            Your Data Categories
          </Text>
          <Text color="$color11" fontSize="$3">
            Categories of personal information we collect about you
          </Text>
          {isLoading ? (
            <XStack padding="$6" justifyContent="center">
              <Spinner size="large" />
            </XStack>
          ) : (
            <DataCategorySummary categories={dataSummary?.categories || []} />
          )}
        </YStack>

        {/* CCPA Rights */}
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="600">
            Your Privacy Rights
          </Text>
          <Text color="$color11" fontSize="$3">
            Under the California Consumer Privacy Act (CCPA), you have the following rights
          </Text>
          <PrivacyRightsList />
        </YStack>

        {/* Request History */}
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="600">
            Request History
          </Text>
          <Text color="$color11" fontSize="$3">
            Your privacy request history and their status
          </Text>
          {isLoading ? (
            <XStack padding="$6" justifyContent="center">
              <Spinner size="large" />
            </XStack>
          ) : (
            <RequestHistoryTable requests={requestHistory?.requests || []} />
          )}
        </YStack>

        {/* Connected Apps */}
        <YStack gap="$3">
          <Text fontSize="$6" fontWeight="600">
            Connected Applications
          </Text>
          <Text color="$color11" fontSize="$3">
            Third-party applications that have access to your data
          </Text>
          {isLoading ? (
            <XStack padding="$6" justifyContent="center">
              <Spinner size="large" />
            </XStack>
          ) : (
            <ConnectedAppsPanel apps={connectedApps || []} />
          )}
        </YStack>

        {/* Footer Links */}
        <YStack
          gap="$3"
          padding="$4"
          backgroundColor="$color2"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text fontSize="$4" fontWeight="600">
            Additional Resources
          </Text>
          <YStack gap="$2">
            <Text
              color="$blue10"
              fontSize="$3"
              cursor="pointer"
              hoverStyle={{ textDecorationLine: 'underline' }}
              onPress={() => window.open('/privacy-policy', '_blank')}
            >
              Read our full Privacy Policy
            </Text>
            <Text
              color="$blue10"
              fontSize="$3"
              cursor="pointer"
              hoverStyle={{ textDecorationLine: 'underline' }}
              onPress={() => window.open('/terms', '_blank')}
            >
              Terms of Service
            </Text>
            <Text
              color="$blue10"
              fontSize="$3"
              cursor="pointer"
              hoverStyle={{ textDecorationLine: 'underline' }}
              onPress={() => window.open('https://oag.ca.gov/privacy/ccpa', '_blank')}
            >
              Learn more about CCPA
            </Text>
          </YStack>
        </YStack>

        {/* Contact Info */}
        <YStack gap="$2" paddingBottom="$6">
          <Text color="$color11" fontSize="$3">
            Questions about your privacy? Contact our Privacy Team at{' '}
            <Text
              color="$blue10"
              cursor="pointer"
              onPress={() => window.open('mailto:privacy@scaffald.com')}
            >
              privacy@scaffald.com
            </Text>
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  )
}

export default PrivacyDashboard
