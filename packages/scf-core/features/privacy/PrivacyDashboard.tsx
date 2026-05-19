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

import { useState } from "react";
import { Button, ScrollView, Spinner, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { openExternalLink, reloadPage } from "@scf/core/utils/platform";
import {
  useCCPADataSummary,
  useCCPAMyRequests,
  useCCPAConnectedApps,
  useCCPAMyOptOuts,
} from "@scf/core/utils/ccpa-sdk-hooks";
import {
  DataCategorySummary,
  type CCPACategory,
} from "./components/DataCategorySummary";
import { PrivacyRightsList } from "./components/PrivacyRightsList";
import { RequestHistoryTable } from "./components/RequestHistoryTable";
import { ConnectedAppsPanel } from "./components/ConnectedAppsPanel";

/**
 * Main Privacy Dashboard component
 */
export function PrivacyDashboard() {
  const { theme } = useThemeContext();
  const [_showRequestForm, setShowRequestForm] = useState(false);
  const [_showOptOutManager, setShowOptOutManager] = useState(false);

  // Fetch user's data summary
  const {
    data: dataSummary,
    isLoading: isLoadingData,
    error: dataError,
  } = useCCPADataSummary();

  // Fetch request history
  const {
    data: requestHistory,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useCCPAMyRequests({ limit: 10 });

  // Fetch connected OAuth apps
  const {
    data: connectedApps,
    isLoading: isLoadingApps,
    error: appsError,
  } = useCCPAConnectedApps();

  // Fetch opt-out status
  const { data: optOutStatus, isLoading: isLoadingOptOut } = useCCPAMyOptOuts();

  const isLoading =
    isLoadingData || isLoadingHistory || isLoadingApps || isLoadingOptOut;
  const hasError = dataError || historyError || appsError;

  if (hasError) {
    return (
      <Stack padding="md" gap={16} align="center" justify="center" flex={1}>
        <Text style={{ color: colors.error[600] }}>
          Error Loading Privacy Dashboard
        </Text>
        <Text style={{ color: colors.text[theme].secondary, textAlign: "center" }}>
          {dataError?.message || historyError?.message || appsError?.message}
        </Text>
        <Button onPress={reloadPage} variant="outline">
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <ScrollView>
      <Stack
        padding="md"
        gap={24}
        style={{ maxWidth: 1200, marginHorizontal: "auto" as const }}
      >
        {/* Page Header */}
        <Stack gap={8}>
          <Text>Privacy & Data</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Manage your privacy settings, view your data, and exercise your
            California Consumer Privacy Act (CCPA) rights.
          </Text>
        </Stack>

        {/* Quick Actions */}
        <Stack
          gap={16}
          padding="md"
          backgroundColor={colors.bg[theme].subtle}
          borderRadius={16}
          borderWidth={1}
          borderColor={colors.border[theme].default}
        >
          <Text>Quick Actions</Text>
          <Row gap={12} wrap>
            <Button
              onPress={() => setShowRequestForm(true)}
              iconStart={undefined}
              size="md"
            >
              Request My Data
            </Button>
            <Button
              onPress={() => setShowRequestForm(true)}
              variant="outline"
              size="md"
            >
              Delete My Data
            </Button>
            <Button
              onPress={() => setShowOptOutManager(true)}
              variant="outline"
              size="md"
            >
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
              <Text style={{ color: colors.info[600] }}>
                Your browser&apos;s Global Privacy Control signal has been
                detected and honored. You have been automatically opted out of
                the sale and sharing of your personal information.
              </Text>
            </Row>
          )}
        </Stack>

        {/* Data Categories Summary */}
        <Stack gap={12}>
          <Text>Your Data Categories</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Categories of personal information we collect about you
          </Text>
          {isLoading ? (
            <Row padding="xl" justify="center">
              <Spinner variant="ios" size="lg" />
            </Row>
          ) : (
            <DataCategorySummary
              categories={(dataSummary?.categories || []).map((c) => ({
                category: c.id as CCPACategory,
                record_count: c.itemCount ?? 0,
                data_types: [],
              }))}
            />
          )}
        </Stack>

        {/* CCPA Rights */}
        <Stack gap={12}>
          <Text>Your Privacy Rights</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Under the California Consumer Privacy Act (CCPA), you have the
            following rights
          </Text>
          <PrivacyRightsList />
        </Stack>

        {/* Request History */}
        <Stack gap={12}>
          <Text>Request History</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Your privacy request history and their status
          </Text>
          {isLoading ? (
            <Row padding="xl" justify="center">
              <Spinner variant="ios" size="lg" />
            </Row>
          ) : (
            <RequestHistoryTable
              requests={
                (requestHistory?.requests ||
                  []) as import("./components/RequestHistoryTable").PrivacyRequest[]
              }
            />
          )}
        </Stack>

        {/* Connected Apps */}
        <Stack gap={12}>
          <Text>Connected Applications</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Third-party applications that have access to your data
          </Text>
          {isLoading ? (
            <Row padding="xl" justify="center">
              <Spinner variant="ios" size="lg" />
            </Row>
          ) : (
            <ConnectedAppsPanel
              apps={
                (connectedApps ||
                  []) as import("./components/ConnectedAppsPanel").ConnectedApp[]
              }
            />
          )}
        </Stack>

        {/* Footer Links */}
        <Stack
          gap={12}
          padding="md"
          backgroundColor={colors.bg[theme].subtle}
          borderRadius={16}
          borderWidth={1}
          borderColor={colors.border[theme].default}
        >
          <Text>Additional Resources</Text>
          <Stack gap={8}>
            <Text
              style={{ color: colors.info[600] }}
              onPress={() => openExternalLink("/privacy-policy")}
            >
              Read our full Privacy Policy
            </Text>
            <Text
              style={{ color: colors.info[600] }}
              onPress={() => openExternalLink("/terms")}
            >
              Terms of Service
            </Text>
            <Text
              style={{ color: colors.info[600] }}
              onPress={() => openExternalLink("https://oag.ca.gov/privacy/ccpa")}
            >
              Learn more about CCPA
            </Text>
          </Stack>
        </Stack>

        {/* Contact Info */}
        <Stack gap={8} paddingBottom={24}>
          <Text style={{ color: colors.text[theme].secondary }}>
            Questions about your privacy? Contact our Privacy Team at{" "}
            <Text
              style={{ color: colors.info[600] }}
              onPress={() => openExternalLink("mailto:privacy@scaffald.com")}
            >
              privacy@scaffald.com
            </Text>
          </Text>
        </Stack>
      </Stack>
    </ScrollView>
  );
}

export default PrivacyDashboard;
