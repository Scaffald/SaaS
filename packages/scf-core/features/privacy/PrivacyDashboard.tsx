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
import { Button, ScrollView, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  useCCPADataSummary,
  useCCPAMyRequests,
  useCCPAConnectedApps,
  useCCPAMyOptOuts,
} from '@scf/core/utils/ccpa-sdk-hooks'
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
  } = useCCPADataSummary()

  // Fetch request history
  const {
    data: requestHistory,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useCCPAMyRequests({ limit: 10 })

  // Fetch connected OAuth apps
  const {
    data: connectedApps,
    isLoading: isLoadingApps,
    error: appsError,
  } = useCCPAConnectedApps()

  // Fetch opt-out status
  const { data: optOutStatus, isLoading: isLoadingOptOut } = useCCPAMyOptOuts()

  const isLoading = isLoadingData || isLoadingHistory || isLoadingApps || isLoadingOptOut
  const hasError = dataError || historyError || appsError

  if (hasError) {
    return (
      <Stack padding="md" gap={16} align="center" justify="center" flex={1}>
        <Text style={{ color: '#ef4444' }}>Error Loading Privacy Dashboard</Text>
        <Text style={{ color: '#414e62', textAlign: 'center' }}>
          {dataError?.message || historyError?.message || appsError?.message}
        </Text>
        <Button onPress={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </Stack>
    )
  }

  return (
    <ScrollView>
      <Stack padding="md" gap={24} maxWidth={1200} marginHorizontal="auto">
        {/* Page Header */}
        <Stack gap={8}>
          <Text>Privacy & Data</Text>
          <Text style={{ color: '#414e62' }}>
            Manage your privacy settings, view your data, and exercise your California Consumer
            Privacy Act (CCPA) rights.
          </Text>
        </Stack>

        {/* Quick Actions */}
        <Stack
          gap={16}
          padding="md"
          backgroundColor={colors.bg.light.subtle}
          borderRadius={16}
          borderWidth={1}
          borderColor={colors.border.light.default}
        >
          <Text>Quick Actions</Text>
          <Row gap={12} wrap>
            <Button onPress={() => setShowRequestForm(true)} iconStart={undefined} size="md">
              Request My Data
            </Button>
            <Button onPress={() => setShowRequestForm(true)} variant="outline" size="md">
              Delete My Data
            </Button>
            <Button onPress={() => setShowOptOutManager(true)} variant="outline" size="md">
              Manage Opt-Outs
            </Button>
          </Row>
          {optOutStatus?.hasGPCOptOut && (
            <Row
              gap={8}
              padding="sm"
              backgroundColor={colors.blue[50]}
              borderRadius={8}
              align="center"
            >
              <Text style={{ color: '#2563eb' }}>
                Your browser&apos;s Global Privacy Control signal has been detected and honored. You
                have been automatically opted out of the sale and sharing of your personal
                information.
              </Text>
            </Row>
          )}
        </Stack>

        {/* Data Categories Summary */}
        <Stack gap={12}>
          <Text>Your Data Categories</Text>
          <Text style={{ color: '#414e62' }}>Categories of personal information we collect about you</Text>
          {isLoading ? (
            <Row padding="xl" justify="center">
              <Spinner size="lg" />
            </Row>
          ) : (
            <DataCategorySummary categories={dataSummary?.categories || []} />
          )}
        </Stack>

        {/* CCPA Rights */}
        <Stack gap={12}>
          <Text>Your Privacy Rights</Text>
          <Text style={{ color: '#414e62' }}>
            Under the California Consumer Privacy Act (CCPA), you have the following rights
          </Text>
          <PrivacyRightsList />
        </Stack>

        {/* Request History */}
        <Stack gap={12}>
          <Text>Request History</Text>
          <Text style={{ color: '#414e62' }}>Your privacy request history and their status</Text>
          {isLoading ? (
            <Row padding="xl" justify="center">
              <Spinner size="lg" />
            </Row>
          ) : (
            <RequestHistoryTable requests={requestHistory?.requests || []} />
          )}
        </Stack>

        {/* Connected Apps */}
        <Stack gap={12}>
          <Text>Connected Applications</Text>
          <Text style={{ color: '#414e62' }}>Third-party applications that have access to your data</Text>
          {isLoading ? (
            <Row padding="xl" justify="center">
              <Spinner size="lg" />
            </Row>
          ) : (
            <ConnectedAppsPanel apps={connectedApps || []} />
          )}
        </Stack>

        {/* Footer Links */}
        <Stack
          gap={12}
          padding="md"
          backgroundColor={colors.bg.light.subtle}
          borderRadius={16}
          borderWidth={1}
          borderColor={colors.border.light.default}
        >
          <Text>Additional Resources</Text>
          <Stack gap={8}>
            <Text
              style={{ color: '#2563eb' }}
              onPress={() => window.open('/privacy-policy', '_blank')}
            >
              Read our full Privacy Policy
            </Text>
            <Text
              style={{ color: '#2563eb' }}
              onPress={() => window.open('/terms', '_blank')}
            >
              Terms of Service
            </Text>
            <Text
              style={{ color: '#2563eb' }}
              onPress={() => window.open('https://oag.ca.gov/privacy/ccpa', '_blank')}
            >
              Learn more about CCPA
            </Text>
          </Stack>
        </Stack>

        {/* Contact Info */}
        <Stack gap={8} paddingBottom={24}>
          <Text style={{ color: '#414e62' }}>
            Questions about your privacy? Contact our Privacy Team at{' '}
            <Text
              style={{ color: '#2563eb' }}
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
