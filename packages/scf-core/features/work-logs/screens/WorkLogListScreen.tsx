import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { useWorkLogs } from '@scf/core/utils/work-logs-sdk-hooks'
import { Activity, CloudOff, DownloadCloud, MessagesSquare, Plus } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { RefreshControl, ScrollView } from 'react-native'
import { Button, Card, Paragraph, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

import { useOfflineWorkLogs } from '../hooks/useOfflineWorkLogs'
import { useWorkLogSync } from '../hooks/useWorkLogSync'
import type { WorkLogListItem } from '@scf/schemas'
import { getStatusColor, getStatusLabel } from '../utils/status-formatting'

type IconRenderer = typeof Activity

export function WorkLogListScreen() {
  const router = useRouter()

  const listQuery = useWorkLogs(
    {},
    {
      staleTime: 30_000,
      refetchOnMount: 'always',
    }
  )

  const {
    offlineWorkLogs,
    isLoading: isOfflineLoading,
    markWorkLogForSync,
    mutateOfflineWorkLog,
    removeOfflineWorkLog,
  } = useOfflineWorkLogs()

  const syncManager = useWorkLogSync({
    offlineWorkLogs,
    markWorkLogForSync,
    mutateOfflineWorkLog,
    removeOfflineWorkLog,
  })

  const hasOfflineQueue = offlineWorkLogs.length > 0

  const handleRefresh = useCallback(() => {
    void listQuery.refetch()
  }, [listQuery])

  const aggregates = useMemo(() => listQuery.data?.aggregates ?? null, [listQuery.data])
  const items: WorkLogListItem[] = listQuery.data?.workLogs ?? []

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={listQuery.isFetching} onRefresh={handleRefresh} />
      }
    >
      <Stack gap="$4" padding="$4" flex={1}>
        <Row justifyContent="space-between" alignItems="center">
          <Stack gap="$1">
            <Text fontSize="$7" fontWeight="700">
              Work Logs
            </Text>
            <Paragraph color="$color10">
              Track and review your daily work history, collaborate with teammates, and manage
              verification.
            </Paragraph>
          </Stack>
          <Button
            size="$4"
            icon={Plus}
            onPress={() => router.push(ROUTES.DASHBOARD.WORK_LOGS.CREATE.path)}
          >
            New Work Log
          </Button>
        </Row>

        {hasOfflineQueue && (
          <Card backgroundColor="$yellow3" borderColor="$yellow7" borderWidth={1}>
            <Stack gap="$3" padding="$3">
              <Row gap="$3" alignItems="center">
                <CloudOff color="#b45309" />
                <Stack gap="$1" flex={1}>
                  <Text fontWeight="600" color="$yellow11">
                    Offline drafts ready to sync
                  </Text>
                  <Paragraph color="$yellow11">
                    {offlineWorkLogs.length} draft{offlineWorkLogs.length === 1 ? '' : 's'} will
                    sync once you are back online.
                  </Paragraph>
                </Stack>
              </Row>
              <Row gap="$3" justifyContent="flex-end">
                <Button
                  size="$3"
                  variant="outlined"
                  disabled={syncManager.isSyncing || isOfflineLoading}
                  onPress={() => syncManager.syncNow()}
                >
                  {syncManager.isSyncing ? 'Syncing…' : 'Sync Now'}
                </Button>
              </Row>
            </Stack>
          </Card>
        )}

        <AnalyticsBanner
          isLoading={listQuery.isLoading}
          totalLogs={listQuery.data?.pagination.totalItems ?? 0}
          totalHours={aggregates?.totalHours ?? 0}
          statusSummary={aggregates?.statusSummary}
        />

        <Separator />

        {listQuery.isLoading ? (
          <Stack flex={1} alignItems="center" justifyContent="center" gap="$3">
            <Spinner size="large" />
            <Text color="$color10">Loading work logs…</Text>
          </Stack>
        ) : items.length === 0 ? (
          <EmptyState onCreate={() => router.push(ROUTES.DASHBOARD.WORK_LOGS.CREATE.path)} />
        ) : (
          <Stack gap="$3" paddingBottom="$6">
            {items.map((item) => (
              <Card
                key={item.id}
                hoverStyle={{ borderColor: '$color10' }}
                pressStyle={{ borderColor: '$color8' }}
                borderColor="$color6"
                borderWidth={1}
                onPress={() =>
                  router.push(buildPath(ROUTES.DASHBOARD.WORK_LOGS.DETAIL, { workLogId: item.id }))
                }
              >
                <Stack gap="$3" padding="$3">
                  <Row justifyContent="space-between" alignItems="center">
                    <Stack gap="$1">
                      <Text fontWeight="700" fontSize="$6">
                        {item.project?.name ?? 'Unknown Project'}
                      </Text>
                      <Text color="$color10">
                        {item.logDate ? formatDate(item.logDate) : 'No date recorded'}
                      </Text>
                    </Stack>
                    <Text fontWeight="600" color={getStatusColor(item.status) as never}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </Row>

                  <Row gap="$2" flexWrap="wrap">
                    <Stack
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$3"
                      backgroundColor={item.visibility === 'public' ? '$green4' : '$gray4'}
                    >
                      <Text
                        fontSize="$2"
                        color={item.visibility === 'public' ? '$green11' : '$gray11'}
                        fontWeight="600"
                      >
                        {item.visibility === 'public' ? 'Public' : 'Private'}
                      </Text>
                    </Stack>
                    {item.showOnProfile && (
                      <Stack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$3"
                        backgroundColor="$blue4"
                      >
                        <Text fontSize="$2" color="$blue11" fontWeight="600">
                          On profile
                        </Text>
                      </Stack>
                    )}
                  </Row>

                  <Row gap="$4" flexWrap="wrap">
                    <MetricPill
                      icon={Activity}
                      label="Hours"
                      value={`${item.totalHours.toFixed(2)}h`}
                    />
                    <MetricPill
                      icon={MessagesSquare}
                      label="Comments"
                      value={`${item.commentCount ?? 0}`}
                    />
                    <MetricPill
                      icon={DownloadCloud}
                      label="Photos"
                      value={`${item.photoCount ?? 0}`}
                    />
                  </Row>

                  {item.descriptionPreview && (
                    <Paragraph numberOfLines={2} color="$color10">
                      {item.descriptionPreview}
                    </Paragraph>
                  )}

                  <Row justifyContent="space-between" alignItems="center">
                    <Text color="$color10" fontSize="$3">
                      Updated {item.updatedAt ? formatDate(item.updatedAt) : 'recently'}
                    </Text>
                    <Button
                      size="$3"
                      variant="outlined"
                      onPress={() =>
                        router.push(
                          buildPath(ROUTES.DASHBOARD.WORK_LOGS.DETAIL, { workLogId: item.id })
                        )
                      }
                    >
                      View Details
                    </Button>
                  </Row>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </ScrollView>
  )
}

interface AnalyticsBannerProps {
  isLoading: boolean
  totalLogs: number
  totalHours: number
  statusSummary?: {
    draft: { count: number; hours: number }
    pending_verification: { count: number; hours: number }
    verified: { count: number; hours: number }
    disputed: { count: number; hours: number }
  }
}

function AnalyticsBanner({
  isLoading,
  totalLogs,
  totalHours,
  statusSummary,
}: AnalyticsBannerProps) {
  return (
    <Card borderColor="$color6" borderWidth={1}>
      <Stack gap="$3" padding="$3">
        <Text fontWeight="700" fontSize="$5">
          Quick summary
        </Text>
        {isLoading && !statusSummary ? (
          <Row gap="$3" alignItems="center">
            <Spinner size="small" />
            <Text color="$color10">Calculating analytics…</Text>
          </Row>
        ) : (
          <Stack gap="$3">
            <Row gap="$4" flexWrap="wrap">
              <SummaryTile label="Total Logs" value={String(totalLogs)} />
              <SummaryTile label="Total Hours" value={`${totalHours.toFixed(2)}h`} />
              <SummaryTile
                label="Verified"
                value={String(statusSummary?.verified.count ?? 0)}
                subtitle={`${(statusSummary?.verified.hours ?? 0).toFixed(1)}h`}
                color="$green10"
              />
              <SummaryTile
                label="Needs Attention"
                value={String(
                  (statusSummary?.pending_verification.count ?? 0) +
                    (statusSummary?.disputed.count ?? 0)
                )}
                subtitle={`${(
                  (statusSummary?.pending_verification.hours ?? 0) +
                    (statusSummary?.disputed.hours ?? 0)
                ).toFixed(1)}h`}
                color="$orange10"
              />
            </Row>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

interface SummaryTileProps {
  label: string
  value: string
  subtitle?: string
  color?: string
}

function SummaryTile({ label, value, subtitle, color = '$color12' }: SummaryTileProps) {
  return (
    <Stack
      backgroundColor="$color2"
      borderRadius="$4"
      paddingHorizontal="$4"
      paddingVertical="$3"
      gap="$1"
      flexShrink={0}
    >
      <Text fontWeight="600" color="$color10">
        {label}
      </Text>
      <Text fontSize="$6" fontWeight="700" color={color as never}>
        {value}
      </Text>
      {subtitle && (
        <Text fontSize="$3" color="$color10">
          {subtitle}
        </Text>
      )}
    </Stack>
  )
}

interface MetricPillProps {
  icon: IconRenderer
  label: string
  value: string
}

function MetricPill({ icon: IconComponent, label, value }: MetricPillProps) {
  return (
    <Row
      backgroundColor="$color3"
      paddingHorizontal="$3"
      paddingVertical="$2"
      borderRadius="$4"
      gap="$2"
      alignItems="center"
    >
      <IconComponent size={16} color="$color10" />
      <Text fontWeight="600">{value}</Text>
      <Text fontSize="$3" color="$color10">
        {label}
      </Text>
    </Row>
  )
}

interface EmptyStateProps {
  onCreate: () => void
}

function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <Card borderColor="$color6" borderWidth={1}>
      <Stack gap="$3" alignItems="center" paddingVertical="$8" paddingHorizontal="$4">
        <Text fontSize="$6" fontWeight="700">
          No work logs yet
        </Text>
        <Paragraph color="$color10" paddingHorizontal="$6" style={{ textAlign: 'center' }}>
          Create your first work log to start tracking hours, documenting tasks, and collaborating
          with your team.
        </Paragraph>
        <Button size="$4" icon={DownloadCloud} onPress={onCreate}>
          Record Work Log
        </Button>
      </Stack>
    </Card>
  )
}
