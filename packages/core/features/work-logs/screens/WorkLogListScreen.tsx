import { ROUTES, buildPath } from '@app/core/constants/routes'
import { formatDate } from '@app/core/features/profile/utils/date-formatting'
import { api } from '@app/core/utils/api'
import { Activity, CloudOff, DownloadCloud, MessagesSquare, Plus } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { RefreshControl, ScrollView } from 'react-native'
import { Button, Card, Paragraph, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

import { useOfflineWorkLogs } from '../hooks/useOfflineWorkLogs'
import { useWorkLogSync } from '../hooks/useWorkLogSync'
import type { WorkLogListItem } from '../schemas'
import { getStatusColor, getStatusLabel } from '../utils/status-formatting'

type IconRenderer = typeof Activity

export function WorkLogListScreen() {
  const router = useRouter()

  const listQuery = api.workLogs.list.useQuery(
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
  const items: WorkLogListItem[] = listQuery.data?.items ?? []

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={listQuery.isFetching} onRefresh={handleRefresh} />
      }
    >
      <YStack gap="$4" p="$4" flex={1}>
        <XStack justify="space-between" items="center">
          <YStack gap="$1">
            <Text fontSize="$7" fontWeight="700">
              Work Logs
            </Text>
            <Paragraph color="$color10">
              Track and review your daily work history, collaborate with teammates, and manage
              verification.
            </Paragraph>
          </YStack>
          <Button size="$4" icon={Plus} onPress={() => router.push(ROUTES.DASHBOARD.WORK_LOGS.CREATE.path)}>
            New Work Log
          </Button>
        </XStack>

        {hasOfflineQueue && (
          <Card bg="$yellow3" borderColor="$yellow7" borderWidth={1}>
            <YStack gap="$3" p="$3">
              <XStack gap="$3" items="center">
                <CloudOff color="#b45309" />
                <YStack gap="$1" flex={1}>
                  <Text fontWeight="600" color="$yellow11">
                    Offline drafts ready to sync
                  </Text>
                  <Paragraph color="$yellow11">
                    {offlineWorkLogs.length} draft{offlineWorkLogs.length === 1 ? '' : 's'} will
                    sync once you are back online.
                  </Paragraph>
                </YStack>
              </XStack>
              <XStack gap="$3" justify="flex-end">
                <Button
                  size="$3"
                  variant="outlined"
                  disabled={syncManager.isSyncing || isOfflineLoading}
                  onPress={() => syncManager.syncNow()}
                >
                  {syncManager.isSyncing ? 'Syncing…' : 'Sync Now'}
                </Button>
              </XStack>
            </YStack>
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
          <YStack flex={1} items="center" justify="center" gap="$3">
            <Spinner size="large" />
            <Text color="$color10">Loading work logs…</Text>
          </YStack>
        ) : items.length === 0 ? (
          <EmptyState onCreate={() => router.push(ROUTES.DASHBOARD.WORK_LOGS.CREATE.path)} />
        ) : (
          <YStack gap="$3" pb="$6">
            {items.map((item) => (
              <Card
                key={item.id}
                hoverStyle={{ borderColor: '$color10' }}
                pressStyle={{ borderColor: '$color8' }}
                borderColor="$color6"
                borderWidth={1}
                onPress={() => router.push(buildPath(ROUTES.DASHBOARD.WORK_LOGS.DETAIL, { workLogId: item.id }))}
              >
                <YStack gap="$3" p="$3">
                  <XStack justify="space-between" items="center">
                    <YStack gap="$1">
                      <Text fontWeight="700" fontSize="$6">
                        {item.project?.name ?? 'Unknown Project'}
                      </Text>
                      <Text color="$color10">
                        {item.logDate ? formatDate(item.logDate) : 'No date recorded'}
                      </Text>
                    </YStack>
                    <Text fontWeight="600" color={getStatusColor(item.status) as never}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </XStack>

                  <XStack gap="$2" flexWrap="wrap">
                    <YStack
                      px="$2"
                      py="$1"
                      rounded="$3"
                      bg={item.visibility === 'public' ? '$green4' : '$gray4'}
                    >
                      <Text
                        fontSize="$2"
                        color={item.visibility === 'public' ? '$green11' : '$gray11'}
                        fontWeight="600"
                      >
                        {item.visibility === 'public' ? 'Public' : 'Private'}
                      </Text>
                    </YStack>
                    {item.showOnProfile && (
                      <YStack px="$2" py="$1" rounded="$3" bg="$blue4">
                        <Text fontSize="$2" color="$blue11" fontWeight="600">
                          On profile
                        </Text>
                      </YStack>
                    )}
                  </XStack>

                  <XStack gap="$4" flexWrap="wrap">
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
                  </XStack>

                  {item.descriptionPreview && (
                    <Paragraph numberOfLines={2} color="$color10">
                      {item.descriptionPreview}
                    </Paragraph>
                  )}

                  <XStack justify="space-between" items="center">
                    <Text color="$color10" fontSize="$3">
                      Updated {item.updatedAt ? formatDate(item.updatedAt) : 'recently'}
                    </Text>
                    <Button
                      size="$3"
                      variant="outlined"
                      onPress={() => router.push(buildPath(ROUTES.DASHBOARD.WORK_LOGS.DETAIL, { workLogId: item.id }))}
                    >
                      View Details
                    </Button>
                  </XStack>
                </YStack>
              </Card>
            ))}
          </YStack>
        )}
      </YStack>
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
      <YStack gap="$3" p="$3">
        <Text fontWeight="700" fontSize="$5">
          Quick summary
        </Text>
        {isLoading && !statusSummary ? (
          <XStack gap="$3" items="center">
            <Spinner size="small" />
            <Text color="$color10">Calculating analytics…</Text>
          </XStack>
        ) : (
          <YStack gap="$3">
            <XStack gap="$4" flexWrap="wrap">
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
            </XStack>
          </YStack>
        )}
      </YStack>
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
    <YStack bg="$color2" rounded="$4" px="$4" py="$3" gap="$1" shrink={0}>
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
    </YStack>
  )
}

interface MetricPillProps {
  icon: IconRenderer
  label: string
  value: string
}

function MetricPill({ icon: IconComponent, label, value }: MetricPillProps) {
  return (
    <XStack bg="$color3" px="$3" py="$2" rounded="$4" gap="$2" items="center">
      <IconComponent size={16} color="$color10" />
      <Text fontWeight="600">{value}</Text>
      <Text fontSize="$3" color="$color10">
        {label}
      </Text>
    </XStack>
  )
}

interface EmptyStateProps {
  onCreate: () => void
}

function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <Card borderColor="$color6" borderWidth={1}>
      <YStack gap="$3" items="center" py="$8" px="$4">
        <Text fontSize="$6" fontWeight="700">
          No work logs yet
        </Text>
        <Paragraph color="$color10" px="$6" style={{ textAlign: 'center' }}>
          Create your first work log to start tracking hours, documenting tasks, and collaborating
          with your team.
        </Paragraph>
        <Button size="$4" icon={DownloadCloud} onPress={onCreate}>
          Record Work Log
        </Button>
      </YStack>
    </Card>
  )
}
