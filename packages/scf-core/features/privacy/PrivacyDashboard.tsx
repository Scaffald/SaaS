/**
 * Privacy Dashboard - Main CCPA Privacy Management Page
 * CCPA Compliance Implementation
 *
 * User-facing dashboard for:
 * - Viewing data categories collected
 * - Understanding CCPA rights
 * - Viewing request history
 * - Managing connected OAuth apps
 * - Quick actions for data requests and opt-outs
 */

import { useState } from 'react'
import { Button, ScrollView, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
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
      <Stack padding="$4" gap="$4" alignItems="center" justifyContent="center" flex={1}>
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
      </Stack>
    )
  }

  return (
    <ScrollView>
      <Stack padding="$4" gap="$6" maxWidth={1200} marginHorizontal="auto">
        {/* Page Header */}
        <Stack gap="$2">
          <Text fontSize="$8" fontWeight="700">
            Privacy & Data
          </Text>
          <Text color="$color11" fontSize="$4">
            Manage your privacy settings, view your data, and exercise your California
            Consumer Privacy Act (CCPA) rights.
          </Text>
        </Stack>

        {/* Quick Actions */}
        <Stack
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
          <Row gap="$3" flexWrap="wrap">
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
          </Row>
          {optOutStatus?.hasGPCOptOut && (
            <Row
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
            </Row>
          )}
        </Stack>

        {/* Data Categories Summary */}
        <Stack gap="$3">
          <Text fontSize="$6" fontWeight="600">
            Your Data Categories
          </Text>
          <Text color="$color11" fontSize="$3">
            Categories of personal information we collect about you
          </Text>
          {isLoading ? (
            <Row padding="$6" justifyContent="center">
              <Spinner size="large" />
            </Row>
          ) : (
            <DataCategorySummary categories={dataSummary?.categories || []} />
          )}
        </Stack>

        {/* CCPA Rights */}
        <Stack gap="$3">
          <Text fontSize="$6" fontWeight="600">
            Your Privacy Rights
          </Text>
          <Text color="$color11" fontSize="$3">
            Under the California Consumer Privacy Act (CCPA), you have the following rights
          </Text>
          <PrivacyRightsList />
        </Stack>

        {/* Request History */}
        <Stack gap="$3">
          <Text fontSize="$6" fontWeight="600">
            Request History
          </Text>
          <Text color="$color11" fontSize="$3">
            Your privacy request history and their status
          </Text>
          {isLoading ? (
            <Row padding="$6" justifyContent="center">
              <Spinner size="large" />
            </Row>
          ) : (
            <RequestHistoryTable requests={requestHistory?.requests || []} />
          )}
        </Stack>

        {/* Connected Apps */}
        <Stack gap="$3">
          <Text fontSize="$6" fontWeight="600">
            Connected Applications
          </Text>
          <Text color="$color11" fontSize="$3">
            Third-party applications that have access to your data
          </Text>
          {isLoading ? (
            <Row padding="$6" justifyContent="center">
              <Spinner size="large" />
            </Row>
          ) : (
            <ConnectedAppsPanel apps={connectedApps || []} />
          )}
        </Stack>

        {/* Footer Links */}
        <Stack
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
          <Stack gap="$2">
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
          </Stack>
        </Stack>

        {/* Contact Info */}
        <Stack gap="$2" paddingBottom="$6">
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
        </Stack>
      </Stack>
    </ScrollView>
  )
}

export default PrivacyDashboard
