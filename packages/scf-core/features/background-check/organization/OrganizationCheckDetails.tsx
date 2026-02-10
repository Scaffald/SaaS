import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { RefreshCcw, X } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo } from 'react'
import { Button, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { getStatusMetadata } from '../components/status.utils'

type RouterOutputs = inferRouterOutputs<AppRouter>
type OrganizationCheckSummary = RouterOutputs['backgroundChecks']['organizationListChecks'][number]
type OrganizationCheckDetail = RouterOutputs['backgroundChecks']['organizationGet']

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
  const checkQuery = api.backgroundChecks.organizationGet.useQuery(
    { background_check_id: checkId },
    {
      refetchOnWindowFocus: false,
    }
  )

  const detail = checkQuery.data

  const componentStatuses = useMemo(() => {
    if (!detail || !Array.isArray(detail.component_statuses)) return []
    return detail.component_statuses as Array<Record<string, unknown>>
  }, [detail])

  return (
    <Stack
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius="$6"
      padding="$4"
      gap="$3"
      backgroundColor="$color2"
    >
      <Row justifyContent="space-between" alignItems="center">
        <Text fontSize="$5" fontWeight="700" color="$color12">
          Background Check Details
        </Text>
        <Row gap="$2">
          <Button
            size="$2"
            variant="outlined"
            icon={RefreshCcw}
            onPress={() => checkQuery.refetch()}
            disabled={checkQuery.isLoading}
          >
            Refresh
          </Button>
          <Button size="$2" variant="outlined" icon={X} onPress={onClose}>
            Close
          </Button>
        </Row>
      </Row>

      {checkQuery.isLoading ? (
        <Stack gap="$2" alignItems="center" paddingVertical="$4">
          <Spinner size="large" />
          <Text fontSize="$3" color="$color11">
            Loading background check details…
          </Text>
        </Stack>
      ) : null}

      {checkQuery.isError ? (
        <Stack gap="$2" padding="$3" backgroundColor="$color3" borderRadius="$4">
          <Text fontSize="$3" color="$color11">
            We couldn’t load the background check details. Please try again.
          </Text>
          <Button
            size="$3"
            variant="outlined"
            icon={RefreshCcw}
            onPress={() => checkQuery.refetch()}
            disabled={checkQuery.isLoading}
          >
            Retry
          </Button>
        </Stack>
      ) : null}

      {!checkQuery.isLoading && !checkQuery.isError && (detail || summary) ? (
        <Stack gap="$3">
          <Stack gap="$1">
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Overview
            </Text>
            <Separator />
          </Stack>

          <Stack gap="$2">
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
            <Stack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Summary
              </Text>
              <Text fontSize="$3" color="$color11">
                {detail.summary}
              </Text>
            </Stack>
          ) : null}

          {detail?.findings ? (
            <Stack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Findings
              </Text>
              <Text fontSize="$3" color="$color11">
                {typeof detail.findings === 'string'
                  ? detail.findings
                  : JSON.stringify(detail.findings, null, 2)}
              </Text>
            </Stack>
          ) : null}

          {componentStatuses.length > 0 ? (
            <Stack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Component Statuses
              </Text>
              <Stack gap="$2">
                {componentStatuses.map((component, index) => (
                  <Stack
                    key={`${component.check_type_id ?? index}`}
                    padding="$3"
                    backgroundColor="$color3"
                    borderRadius="$4"
                  >
                    <Text fontSize="$3" fontWeight="600" color="$color12">
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
            <Stack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Metadata
              </Text>
              <Text
                fontSize="$3"
                color="$color10"
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
    <Row gap="$2" justifyContent="space-between" flexWrap="wrap">
      <Text fontSize="$3" color="$color10">
        {label}
      </Text>
      <Text fontSize="$3" color="$color12" fontWeight="600">
        {value}
      </Text>
    </Row>
  )
}
