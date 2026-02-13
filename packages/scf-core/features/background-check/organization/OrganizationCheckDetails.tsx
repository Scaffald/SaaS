import { useBackgroundCheck } from '@scf/core/utils/background-checks-sdk-hooks'
import { RefreshCcw, X } from 'lucide-react-native'
import { useMemo } from 'react'
import { Button, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { getStatusMetadata } from '../components/status.utils'

type OrganizationCheckSummary = {
  id: string;
  status: string;
  [key: string]: unknown;
};
type OrganizationCheckDetail = {
  id: string;
  status: string;
  component_statuses?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

interface OrganizationCheckDetailsProps {
  checkId: string
  summary?: OrganizationCheckSummary
  onClose: () => void
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const formatStatus = (status: string) =>
  getStatusMetadata(status as OrganizationCheckDetail['status']).label

export function OrganizationCheckDetails({
  checkId,
  summary,
  onClose,
}: OrganizationCheckDetailsProps) {
  const checkQuery = useBackgroundCheck(checkId || undefined)

  const detail = checkQuery.data

  const componentStatuses = useMemo(() => {
    if (!detail || !Array.isArray(detail.component_statuses)) return []
    return detail.component_statuses as Array<Record<string, unknown>>
  }, [detail])

  return (
    <Stack
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius={24}
      padding={16}
      gap={12}
      backgroundColor="$color2"
    >
      <Row justify="space-between" align="center">
        <Text color="gray">
          Background Check Details
        </Text>
        <Row gap={8}>
          <Button
            size={8}
            variant="outline"
            icon={RefreshCcw}
            onPress={() => checkQuery.refetch()}
            disabled={checkQuery.isLoading}
          >
            Refresh
          </Button>
          <Button size={8} variant="outline" icon={X} onPress={onClose}>
            Close
          </Button>
        </Row>
      </Row>

      {checkQuery.isLoading ? (
        <Stack gap={8} align="center" paddingVertical={16}>
          <Spinner size="lg" />
          <Text color="gray">
            Loading background check details…
          </Text>
        </Stack>
      ) : null}

      {checkQuery.isError ? (
        <Stack gap={8} padding={12} backgroundColor="$color3" borderRadius={16}>
          <Text color="gray">
            We couldn’t load the background check details. Please try again.
          </Text>
          <Button
            size={12}
            variant="outline"
            icon={RefreshCcw}
            onPress={() => checkQuery.refetch()}
            disabled={checkQuery.isLoading}
          >
            Retry
          </Button>
        </Stack>
      ) : null}

      {!checkQuery.isLoading && !checkQuery.isError && (detail || summary) ? (
        <Stack gap={12}>
          <Stack gap={4}>
            <Text color="gray">
              Overview
            </Text>
            <Separator />
          </Stack>

          <Stack gap={8}>
            <InfoRow
              label="Status"
              value={formatStatus(detail?.status ?? summary?.status ?? 'pending')}
            />
            <InfoRow
              label="Worker"
              value={
                summary
                  ? (summary.worker?.display_name ??
                    summary.worker?.username ??
                    (summary.worker_user_id
                      ? `User ${summary.worker_user_id.substring(0, 8)}`
                      : 'Unknown worker'))
                  : '—'
              }
            />
            <InfoRow
              label="Package"
              value={summary?.package?.display_name ?? summary?.package?.slug ?? 'Unknown package'}
            />
            <InfoRow label="Requested" value={formatDateTime(summary?.created_at)} />
            <InfoRow label="Invited" value={formatDateTime(summary?.invited_at)} />
            <InfoRow
              label="Completed"
              value={formatDateTime(detail?.completed_at ?? summary?.completed_at)}
            />
            <InfoRow
              label="Expires"
              value={formatDateTime(detail?.expires_at ?? summary?.expires_at)}
            />
            <InfoRow
              label="Estimated Completion"
              value={formatDateTime(detail?.estimated_completion_date ?? null)}
            />
          </Stack>

          <Separator />

          {detail?.summary ? (
            <Stack gap={8}>
              <Text color="gray">
                Summary
              </Text>
              <Text color="gray">
                {detail.summary}
              </Text>
            </Stack>
          ) : null}

          {detail?.findings ? (
            <Stack gap={8}>
              <Text color="gray">
                Findings
              </Text>
              <Text color="gray">
                {typeof detail.findings === 'string'
                  ? detail.findings
                  : JSON.stringify(detail.findings, null, 2)}
              </Text>
            </Stack>
          ) : null}

          {componentStatuses.length > 0 ? (
            <Stack gap={8}>
              <Text color="gray">
                Component Statuses
              </Text>
              <Stack gap={8}>
                {componentStatuses.map((component, index) => (
                  <Stack
                    key={`${component.check_type_id ?? index}`}
                    padding={12}
                    backgroundColor="$color3"
                    borderRadius={16}
                  >
                    <Text color="gray">
                      {(component.check_type_id as string | undefined)?.slice(0, 8) ??
                        `Component ${index + 1}`}
                    </Text>
                    <InfoRow
                      label="Status"
                      value={formatStatus((component.status as string | undefined) ?? 'pending')}
                    />
                    <InfoRow
                      label="Completed"
                      value={formatDateTime(component.completed_at as string | undefined)}
                    />
                    {component.findings ? (
                      <InfoRow
                        label="Findings"
                        value={
                          typeof component.findings === 'string'
                            ? (component.findings as string)
                            : JSON.stringify(component.findings, null, 2)
                        }
                      />
                    ) : null}
                  </Stack>
                ))}
              </Stack>
            </Stack>
          ) : null}

          {detail?.metadata ? (
            <Stack gap={8}>
              <Text color="gray">
                Metadata
              </Text>
              <Text
                color="gray"
                style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
              >
                {JSON.stringify(detail.metadata, null, 2)}
              </Text>
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  )
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Row gap={8} justify="space-between" flexWrap="wrap">
      <Text color="gray">
        {label}
      </Text>
      <Text color="gray">
        {value}
      </Text>
    </Row>
  )
}
