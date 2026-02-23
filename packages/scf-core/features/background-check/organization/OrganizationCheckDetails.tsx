import { useBackgroundCheck } from '@scf/core/utils/background-checks-sdk-hooks'
import { RefreshCcw, X } from 'lucide-react-native'
import { useMemo } from 'react'
import { Platform } from 'react-native'
import { Button, Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'
import { getStatusMetadata } from '../components/status.utils'

type OrganizationCheckSummary = {
  id: string
  status: string
  worker_user_id?: string
  worker?: {
    display_name?: string | null
    username?: string | null
    email?: string | null
    avatar_path?: string | null
  } | null
  package?: {
    display_name?: string | null
    slug?: string | null
  } | null
  job?: { id?: string | null; title?: string | null } | null
  completed_at?: string | null
  created_at?: string | null
  invited_at?: string | null
  expires_at?: string | null
  [key: string]: unknown
}
type OrganizationCheckDetail = {
  id: string
  status: string
  component_statuses?: Array<Record<string, unknown>>
  [key: string]: unknown
}

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

  const detail = checkQuery.data?.check

  const componentStatuses = useMemo(() => {
    if (!detail || !Array.isArray(detail.component_statuses)) return []
    return detail.component_statuses as Array<Record<string, unknown>>
  }, [detail])

  return (
    <Stack
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius={24}
      padding="md"
      gap={12}
      backgroundColor="$color2"
    >
      <Row justify="space-between" align="center">
        <Text color="$gray11">Background Check Details</Text>
        <Row gap={8}>
          <Button
            size="sm"
            variant="outline"
            iconStart={RefreshCcw}
            onPress={() => checkQuery.refetch()}
            disabled={checkQuery.isLoading}
          >
            Refresh
          </Button>
          <Button size="sm" variant="outline" iconStart={X} onPress={onClose}>
            Close
          </Button>
        </Row>
      </Row>

      {checkQuery.isLoading ? (
        <Stack gap={8} align="center" paddingVertical={16}>
          <Spinner size="lg" />
          <Text color="$gray11">Loading background check details…</Text>
        </Stack>
      ) : null}

      {checkQuery.isError ? (
        <Stack gap={8} padding="sm" backgroundColor="$color3" borderRadius={16}>
          <Text color="$gray11">
            We couldn’t load the background check details. Please try again.
          </Text>
          <Button
            size="sm"
            variant="outline"
            iconStart={RefreshCcw}
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
            <Text color="$gray11">Overview</Text>
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
                summary && typeof summary === 'object' && 'worker' in summary
                  ? ((
                      (summary as { worker?: { display_name?: string; username?: string }; worker_user_id?: string }).worker
                        ?.display_name ??
                      (summary as { worker?: { username?: string }; worker_user_id?: string }).worker
                        ?.username ??
                      ((summary as { worker_user_id?: string }).worker_user_id
                        ? `User ${(summary as { worker_user_id: string }).worker_user_id.substring(0, 8)}`
                        : 'Unknown worker'))
                  )
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
              <Text color="$gray11">Summary</Text>
              <Text color="$gray11">{detail.summary}</Text>
            </Stack>
          ) : null}

          {detail?.findings ? (
            <Stack gap={8}>
              <Text color="$gray11">Findings</Text>
              <Text color="$gray11">
                {typeof detail.findings === 'string'
                  ? detail.findings
                  : JSON.stringify(detail.findings, null, 2)}
              </Text>
            </Stack>
          ) : null}

          {componentStatuses.length > 0 ? (
            <Stack gap={8}>
              <Text color="$gray11">Component Statuses</Text>
              <Stack gap={8}>
                {componentStatuses.map((component, index) => (
                  <Stack
                    key={`${component.check_type_id ?? index}`}
                    padding="sm"
                    backgroundColor="$color3"
                    borderRadius={16}
                  >
                    <Text color="$gray11">
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
              <Text color="$gray11">Metadata</Text>
              <Text
                color="$gray11"
                style={{
                  fontFamily: 'monospace',
                  ...(Platform.OS === 'web' && { whiteSpace: 'pre-wrap' }),
                }}
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
    <Row gap={8} justify="space-between" wrap>
      <Text color="$gray11">{label}</Text>
      <Text color="$gray11">{value}</Text>
    </Row>
  )
}
