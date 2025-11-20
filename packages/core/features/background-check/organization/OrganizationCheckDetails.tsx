import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { RefreshCcw, X } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { useMemo } from 'react'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'
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
    <YStack borderWidth={1} borderColor="$borderColor" rounded="$6" p="$4" gap="$3" bg="$color2">
      <XStack justify="space-between" items="center">
        <Text fontSize="$5" fontWeight="700" color="$color12">
          Background Check Details
        </Text>
        <XStack gap="$2">
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
        </XStack>
      </XStack>

      {checkQuery.isLoading ? (
        <YStack gap="$2" items="center" py="$4">
          <Spinner size="large" />
          <Text fontSize="$3" color="$color11">
            Loading background check details…
          </Text>
        </YStack>
      ) : null}

      {checkQuery.isError ? (
        <YStack gap="$2" p="$3" bg="$color3" rounded="$4">
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
        </YStack>
      ) : null}

      {!checkQuery.isLoading && !checkQuery.isError && (detail || summary) ? (
        <YStack gap="$3">
          <YStack gap="$1">
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Overview
            </Text>
            <Separator />
          </YStack>

          <YStack gap="$2">
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
            <InfoRow
              label="Requested"
              value={formatDateTime(detail?.created_at ?? summary?.created_at)}
            />
            <InfoRow
              label="Invited"
              value={formatDateTime(detail?.invited_at ?? summary?.invited_at)}
            />
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
          </YStack>

          <Separator />

          {detail?.summary ? (
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Summary
              </Text>
              <Text fontSize="$3" color="$color11">
                {detail.summary}
              </Text>
            </YStack>
          ) : null}

          {detail?.findings ? (
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Findings
              </Text>
              <Text fontSize="$3" color="$color11">
                {typeof detail.findings === 'string'
                  ? detail.findings
                  : JSON.stringify(detail.findings, null, 2)}
              </Text>
            </YStack>
          ) : null}

          {componentStatuses.length > 0 ? (
            <YStack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Component Statuses
              </Text>
              <YStack gap="$2">
                {componentStatuses.map((component, index) => (
                  <YStack
                    key={`${component.check_type_id ?? index}`}
                    p="$3"
                    bg="$color3"
                    rounded="$4"
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
                  </YStack>
                ))}
              </YStack>
            </YStack>
          ) : null}

          {detail?.metadata ? (
            <YStack gap="$2">
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
            </YStack>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  )
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <XStack gap="$2" justify="space-between" flexWrap="wrap">
      <Text fontSize="$3" color="$color10">
        {label}
      </Text>
      <Text fontSize="$3" color="$color12" fontWeight="600">
        {value}
      </Text>
    </XStack>
  )
}
