import { formatDate } from "@scf/core/features/profile/utils/date-formatting";
import { useBackgroundCheck } from "@scf/core/utils/background-checks-sdk-hooks";
import {
  AlertTriangle,
  X as CloseIcon,
  DownloadCloud,
} from "lucide-react-native";
import { memo } from "react";
import { Alert } from "react-native";
import { Button, Separator, Spinner, Text, Row, Stack, useThemeContext } from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { useDispute } from "../hooks/useDispute";
import { CheckProgressTracker } from "./CheckProgressTracker";
import { DisputeStatusTracker } from "./DisputeStatusTracker";
import { PrivacyControls } from "./PrivacyControls";
import type { BackgroundCheck } from "@scaffald/sdk";
import {
  type BackgroundCheckDocument,
  type BackgroundCheckSummary,
  getStatusMetadata,
  getStatusToneColors,
} from "./status.utils";

/** API can return check with extended fields beyond base BackgroundCheck */
type CheckDetail = BackgroundCheck & {
  status_history?: unknown;
  component_statuses?: unknown;
  estimated_completion_date?: string | null;
  summary?: unknown;
  findings?: unknown;
};

interface ResultsViewerProps {
  checkId: string | null;
  summary?: BackgroundCheckSummary;
  onClose: () => void;
  onRequestDispute?: (checkId: string) => void;
}

export const ResultsViewer = memo(function ResultsViewer({
  checkId,
  summary,
  onClose,
  onRequestDispute,
}: ResultsViewerProps) {
  const { theme } = useThemeContext();
  const t = theme === 'dark' ? 'dark' : 'light';

  const getCheckQuery = useBackgroundCheck(checkId || undefined, {
    enabled: Boolean(checkId),
  });

  const { disputes, isLoadingDisputes, hasActiveDispute, refetchDisputes } =
    useDispute({
      checkId: checkId ?? null,
      enabled: Boolean(checkId),
    });

  if (!checkId) {
    return null;
  }

  if (getCheckQuery.isLoading || getCheckQuery.isFetching) {
    return (
      <Stack
        gap={12}
        padding="md"
        backgroundColor={colors.bg[t].default}
        borderRadius={16}
        borderWidth={1}
        borderColor={colors.border[t].default}
      >
        <Row gap={8} align="center">
          <Spinner variant="ios" size="sm" color="gray" />
          <Text color={colors.text[t].secondary}>Loading background check details…</Text>
        </Row>
      </Stack>
    );
  }

  const data = getCheckQuery.data as typeof getCheckQuery.data & {
    check?: CheckDetail;
    documents?: unknown[];
  };
  const detail: CheckDetail | undefined = (data?.check ?? data) as
    | CheckDetail
    | undefined;
  const documents = data?.documents ?? [];

  if (getCheckQuery.isError || !detail) {
    return (
      <Stack
        gap={12}
        padding="md"
        backgroundColor={colors.bg[t].default}
        borderRadius={16}
        borderWidth={1}
        borderColor={colors.border[t].default}
      >
        <Row gap={8} align="center">
          <AlertTriangle size={18} color={t === 'dark' ? colors.error[300] : colors.error[600]} />
          <Text color={t === 'dark' ? colors.error[300] : colors.error[600]}>
            We couldn't load your background check details. Try again.
          </Text>
        </Row>
        <Button
          size="sm"
          variant="outline"
          onPress={() => getCheckQuery.refetch()}
        >
          Retry
        </Button>
      </Stack>
    );
  }
  const statusMeta = getStatusMetadata(detail.status);
  const statusColors = getStatusToneColors(statusMeta.tone, t);

  let completedAtFromHistory: string | null = null;
  if (Array.isArray(detail.status_history)) {
    for (const entry of detail.status_history as unknown[]) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      const statusValue =
        typeof record.status === "string" ? record.status : null;
      if (!statusValue?.startsWith("completed")) continue;
      const occurredAt =
        typeof record.occurred_at === "string"
          ? (record.occurred_at as string)
          : null;
      if (occurredAt) {
        completedAtFromHistory = occurredAt;
      }
    }
  }

  return (
    <Stack
      gap={16}
      padding="md"
      backgroundColor={colors.bg[t].default}
      borderRadius={16}
      borderWidth={1}
      borderColor={colors.border[t].default}
    >
      <Row justify="space-between" align="center">
        <Stack gap={4}>
          <Text color={colors.text[t].secondary}>
            {summary?.package?.display_name ?? "Background check results"}
          </Text>
          <Row gap={8} align="center">
            <Stack
              paddingHorizontal={12}
              paddingVertical={4}
              backgroundColor={statusColors.background}
              borderWidth={1}
              borderColor={statusColors.border}
              borderRadius={12}
            >
              <Text color={statusColors.text}>{statusMeta.label}</Text>
            </Stack>
            <Text color={colors.text[t].secondary}>
              Last updated {formatDate(detail.updated_at)}
            </Text>
          </Row>
        </Stack>
        <Button
          size="sm"
          variant="outline"
          iconStart={CloseIcon}
          onPress={onClose}
        >
          Close
        </Button>
      </Row>

      <CheckProgressTracker
        status={detail.status}
        createdAt={detail.created_at}
        componentStatuses={detail.component_statuses}
        statusHistory={detail.status_history}
        estimatedCompletionDate={detail.estimated_completion_date}
        completedAt={completedAtFromHistory}
        expiresAt={detail.expires_at ?? null}
      />

      <DisputeStatusTracker
        disputes={disputes}
        isLoading={isLoadingDisputes}
        onRefresh={refetchDisputes}
      />

      {onRequestDispute && summary?.status && (
        <Stack
          gap={8}
          padding="sm"
          backgroundColor={colors.bg[t].muted}
          borderRadius={16}
          borderWidth={1}
          borderColor={colors.border[t].default}
        >
          <Text color={colors.text[t].secondary}>Notice something inaccurate?</Text>
          <Text color={colors.text[t].secondary}>
            Submit a dispute so our compliance team can review and correct any
            issues.
          </Text>
          <Button
            size="sm"
            color="primary"
            disabled={hasActiveDispute}
            onPress={() => {
              if (checkId) {
                onRequestDispute(checkId);
              }
            }}
          >
            {hasActiveDispute ? "Dispute in progress" : "Dispute results"}
          </Button>
        </Stack>
      )}

      {detail.summary != null && (
        <Stack gap={8}>
          <Text color={colors.text[t].secondary}>Summary</Text>
          <Text color={colors.text[t].secondary}>
            {String(
              typeof detail.summary === "string"
                ? detail.summary
                : JSON.stringify(detail.summary)
            )}
          </Text>
        </Stack>
      )}

      {detail.findings && (
        <Stack gap={8}>
          <Text color={colors.text[t].secondary}>Findings</Text>
          <Text color={colors.text[t].secondary}>
            {JSON.stringify(detail.findings, null, 2)}
          </Text>
        </Stack>
      )}

      <Stack gap={12}>
        <Row justify="space-between" align="center">
          <Text color={colors.text[t].secondary}>Documents</Text>
          <Button
            size="sm"
            variant="outline"
            iconStart={DownloadCloud}
            onPress={() =>
              Alert.alert(
                "Download coming soon",
                "Downloadable reports will be available once signed report URLs are enabled."
              )
            }
            disabled={documents.length === 0}
          >
            Download report
          </Button>
        </Row>
        {documents.length === 0 ? (
          <Text color={colors.text[t].secondary}>No documents uploaded yet.</Text>
        ) : (
          <Stack gap={8}>
            {documents.map((document: BackgroundCheckDocument) => (
              <Row
                key={document.id}
                justify="space-between"
                align="center"
                padding="sm"
                backgroundColor={colors.bg[t].muted}
                borderRadius={12}
                borderWidth={1}
                borderColor={colors.border[t].default}
              >
                <Stack gap={4}>
                  <Text color={colors.text[t].secondary}>{document.file_name}</Text>
                  <Text color={colors.text[t].secondary}>
                    Uploaded {formatDate(document.uploaded_at)}
                  </Text>
                </Stack>
                <Button size="sm" variant="outline" disabled>
                  View
                </Button>
              </Row>
            ))}
          </Stack>
        )}
      </Stack>

      <Separator />

      <PrivacyControls checkId={checkId} metadata={detail.metadata} />
    </Stack>
  );
});
