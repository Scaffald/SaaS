import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { formatDate } from '@scf/core/features/profile/utils/date-formatting'
import { useWorkLogs } from '@scf/core/utils/work-logs-sdk-hooks'
import { Activity, CloudOff, DownloadCloud, MessagesSquare, Plus } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { RefreshControl, ScrollView } from 'react-native'
import {
  Button,
  Card,
  Paragraph,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

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
      <Stack gap={16} padding={16} flex={1}>
        <Row justify="space-between" align="center">
          <Stack gap={4}>
            <Text>Work Logs</Text>
            <Paragraph color="gray">
              Track and review your daily work history, collaborate with teammates, and manage
              verification.
            </Paragraph>
          </Stack>
          <Button
            size={16}
            icon={Plus}
            onPress={() => router.push(ROUTES.DASHBOARD.WORK_LOGS.CREATE.path)}
          >
            New Work Log
          </Button>
        </Row>

        {hasOfflineQueue && (
          <Card backgroundColor="$yellow3" borderColor="$yellow7" borderWidth={1}>
            <Stack gap={12} padding={12}>
              <Row gap={12} align="center">
                <CloudOff color="#b45309" />
                <Stack gap={4} flex={1}>
                  <Text color="$yellow11">Offline drafts ready to sync</Text>
                  <Paragraph color="$yellow11">
                    {offlineWorkLogs.length} draft{offlineWorkLogs.length === 1 ? '' : 's'} will
                    sync once you are back online.
                  </Paragraph>
                </Stack>
              </Row>
              <Row gap={12} justify="flex-end">
                <Button
                  size={12}
                  variant="outline"
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
          <Stack flex={1} align="center" justify="center" gap={12}>
            <Spinner size="lg" />
            <Text color="gray">Loading work logs…</Text>
          </Stack>
        ) : items.length === 0 ? (
          <EmptyState onCreate={() => router.push(ROUTES.DASHBOARD.WORK_LOGS.CREATE.path)} />
        ) : (
          <Stack gap={12} paddingBottom={24}>
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
                <Stack gap={12} padding={12}>
                  <Row justify="space-between" align="center">
                    <Stack gap={4}>
                      <Text>{item.project?.name ?? 'Unknown Project'}</Text>
                      <Text color="gray">
                        {item.logDate ? formatDate(item.logDate) : 'No date recorded'}
                      </Text>
                    </Stack>
                    <Text color={getStatusColor(item.status) as never}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </Row>

                  <Row gap={8} flexWrap="wrap">
                    <Stack
                      paddingHorizontal={8}
                      paddingVertical={4}
                      borderRadius={12}
                      backgroundColor={item.visibility === 'public' ? '$green4' : '$gray4'}
                    >
                      <Text color={item.visibility === 'public' ? '$green11' : '$gray11'}>
                        {item.visibility === 'public' ? 'Public' : 'Private'}
                      </Text>
                    </Stack>
                    {item.showOnProfile && (
                      <Stack
                        paddingHorizontal={8}
                        paddingVertical={4}
                        borderRadius={12}
                        backgroundColor="$blue4"
                      >
                        <Text color="$blue11">On profile</Text>
                      </Stack>
                    )}
                  </Row>

                  <Row gap={16} flexWrap="wrap">
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
                    <Paragraph numberOfLines={2} color="gray">
                      {item.descriptionPreview}
                    </Paragraph>
                  )}

                  <Row justify="space-between" align="center">
                    <Text color="gray">
                      Updated {item.updatedAt ? formatDate(item.updatedAt) : 'recently'}
                    </Text>
                    <Button
                      size={12}
                      variant="outline"
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
      <Stack gap={12} padding={12}>
        <Text>Quick summary</Text>
        {isLoading && !statusSummary ? (
          <Row gap={12} align="center">
            <Spinner size="sm" />
            <Text color="gray">Calculating analytics…</Text>
          </Row>
        ) : (
          <Stack gap={12}>
            <Row gap={16} flexWrap="wrap">
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
      borderRadius={16}
      paddingHorizontal={16}
      paddingVertical={12}
      gap={4}
      flexShrink={0}
    >
      <Text color="gray">{label}</Text>
      <Text color={color as never}>{value}</Text>
      {subtitle && <Text color="gray">{subtitle}</Text>}
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
      paddingHorizontal={12}
      paddingVertical={8}
      borderRadius={16}
      gap={8}
      align="center"
    >
      <IconComponent size={16} color="gray" />
      <Text>{value}</Text>
      <Text color="gray">{label}</Text>
    </Row>
  )
}

interface EmptyStateProps {
  onCreate: () => void
}

function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <Card borderColor="$color6" borderWidth={1}>
      <Stack gap={12} align="center" paddingVertical={32} paddingHorizontal={16}>
        <Text>No work logs yet</Text>
        <Paragraph color="gray" paddingHorizontal={24} style={{ textAlign: 'center' }}>
          Create your first work log to start tracking hours, documenting tasks, and collaborating
          with your team.
        </Paragraph>
        <Button size={16} icon={DownloadCloud} onPress={onCreate}>
          Record Work Log
        </Button>
      </Stack>
    </Card>
  )
}
