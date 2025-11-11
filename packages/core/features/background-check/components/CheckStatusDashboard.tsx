import { useMemo, useState } from 'react'
import { RefreshCcw, ShieldCheck } from '@tamagui/lucide-icons'
import { Button, ScrollView, Separator, Spinner, Text, XStack, YStack } from 'tamagui'
import { useRouter } from 'expo-router'

import { api } from '@app/core/utils/api'

import { CheckStatusCard } from './CheckStatusCard'
import { ResultsViewer } from './ResultsViewer'
import {
  getStatusCategory,
  type BackgroundCheckSummary,
} from './status.utils'

type FilterValue = 'all' | 'active' | 'completed' | 'expired'

const FILTER_DEFINITIONS: Array<{ label: string; value: FilterValue }> = [
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Expired', value: 'expired' },
  { label: 'All', value: 'all' },
]

export function CheckStatusDashboard() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<FilterValue>('active')
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null)

  const checksQuery = api.backgroundChecks.listChecks.useQuery(undefined, {
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60,
  })

  const selectedCheck = useMemo(
    () =>
      selectedCheckId && checksQuery.data
        ? checksQuery.data.find(
            (check: BackgroundCheckSummary) => check.id === selectedCheckId,
          ) ?? null
        : null,
    [selectedCheckId, checksQuery.data],
  )

  const counts = useMemo(() => {
    const data: BackgroundCheckSummary[] = checksQuery.data ?? []
    const summary = { total: 0, active: 0, completed: 0, expired: 0 }
    for (const check of data) {
      const category = getStatusCategory(check.status)
      if (category === 'active') summary.active += 1
      if (category === 'completed') summary.completed += 1
      if (category === 'expired') summary.expired += 1
      summary.total += 1
    }
    return summary
  }, [checksQuery.data])

  const filteredChecks = useMemo(() => {
    if (!checksQuery.data) return []
    if (activeFilter === 'all') return checksQuery.data
    return checksQuery.data.filter(
      (check: BackgroundCheckSummary) => getStatusCategory(check.status) === activeFilter,
    )
  }, [checksQuery.data, activeFilter])

  const handleStartNewCheck = () => {
    router.push('/dashboard/profile/background-check/initiate')
  }

  const handleViewDetails = (check: BackgroundCheckSummary) => {
    setSelectedCheckId(check.id)
  }

  const handleRenew = (check: BackgroundCheckSummary) => {
    setSelectedCheckId(check.id)
    router.push('/dashboard/profile/background-check/initiate')
  }

  return (
    <YStack flex={1} bg="$background">
      <ScrollView flex={1}>
        <YStack gap="$4" px="$4" pb="$6">
          <YStack gap="$3" p="$4" bg="$background" borderBottomWidth={1} borderBottomColor="$borderColor">
            <XStack gap="$3" items="center">
              <ShieldCheck size={28} color="$blue10" />
              <YStack gap="$1">
                <Text fontSize="$6" fontWeight="700" color="$color12">
                  Background check dashboard
                </Text>
                <Text fontSize="$2" color="$color10">
                  Track your screenings, monitor progress, and manage who can see your results.
                </Text>
              </YStack>
            </XStack>
            <XStack gap="$2" flexWrap="wrap">
              {FILTER_DEFINITIONS.map((filter) => {
                const isActive = activeFilter === filter.value
                return (
                  <Button
                    key={filter.value}
                    size="$3"
                    theme={isActive ? 'blue' : undefined}
                    variant={isActive ? undefined : 'outlined'}
                    onPress={() => setActiveFilter(filter.value)}
                  >
                    {filter.label}
                    {filter.value === 'active' ? ` (${counts.active})` : ''}
                    {filter.value === 'completed' ? ` (${counts.completed})` : ''}
                    {filter.value === 'expired' ? ` (${counts.expired})` : ''}
                    {filter.value === 'all' ? ` (${counts.total})` : ''}
                  </Button>
                )
              })}
            </XStack>
          </YStack>

          {checksQuery.isLoading && (
            <YStack gap="$2" items="center" py="$6">
              <Spinner size="large" color="$color11" />
              <Text fontSize="$3" color="$color10">
                Loading your background checks…
              </Text>
            </YStack>
          )}

          {checksQuery.isError && (
            <YStack gap="$3" p="$4" bg="$color2" rounded="$4" borderWidth={1} borderColor="$borderColor">
              <Text fontSize="$3" color="$color11">
                We couldn’t load your background checks. Please try again.
              </Text>
              <Button
                size="$3"
                variant="outlined"
                icon={RefreshCcw}
                onPress={() => checksQuery.refetch()}
              >
                Retry
              </Button>
            </YStack>
          )}

          {!checksQuery.isLoading && !checksQuery.isError && filteredChecks.length === 0 && (
            <YStack gap="$3" p="$4" bg="$color2" rounded="$4" borderWidth={1} borderColor="$borderColor">
              <Text fontSize="$3" color="$color11">
                No background checks found for this filter.
              </Text>
              <Button size="$3" theme="blue" onPress={handleStartNewCheck}>
                Start a background check
              </Button>
            </YStack>
          )}

          {filteredChecks.map((check: BackgroundCheckSummary) => (
            <CheckStatusCard
              key={check.id}
              check={check}
              onViewDetails={handleViewDetails}
              onRenew={handleRenew}
            />
          ))}

          <YStack gap="$2" p="$3" bg="$color2" rounded="$4" borderWidth={1} borderColor="$borderColor">
            <Text fontSize="$3" fontWeight="600" color="$color12">
              Need a new screening?
            </Text>
            <Text fontSize="$2" color="$color10">
              Start a new background check whenever you need to refresh your credentials.
            </Text>
            <Button size="$3" theme="blue" onPress={handleStartNewCheck}>
              Start background check
            </Button>
          </YStack>

          {selectedCheckId && (
            <YStack gap="$3">
              <Separator />
              <ResultsViewer
                checkId={selectedCheckId}
                summary={selectedCheck ?? undefined}
                onClose={() => setSelectedCheckId(null)}
              />
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  )
}