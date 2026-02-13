import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useBackgroundChecks } from '@scf/core/utils/background-checks-sdk-hooks'
import { RefreshCcw, ShieldCheck } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { Button, ScrollView, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

import { CheckStatusCard } from './CheckStatusCard'
import { DisputeBackgroundCheckDialog } from './DisputeBackgroundCheckDialog'
import { ResultsViewer } from './ResultsViewer'
import { type BackgroundCheckSummary, canDisputeStatus, getStatusCategory } from './status.utils'

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
  const [disputeCheck, setDisputeCheck] = useState<BackgroundCheckSummary | null>(null)
  const isWeb = Platform.OS === 'web'

  const checksQuery = useBackgroundChecks()

  const selectedCheck = useMemo(
    () =>
      selectedCheckId && checksQuery.data
        ? (checksQuery.data.find((check: BackgroundCheckSummary) => check.id === selectedCheckId) ??
          null)
        : null,
    [selectedCheckId, checksQuery.data]
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
      (check: BackgroundCheckSummary) => getStatusCategory(check.status) === activeFilter
    )
  }, [checksQuery.data, activeFilter])

  const handleStartNewCheck = () => {
    router.push(ROUTES.DASHBOARD.PROFILE.BACKGROUND_CHECK.INITIATE.path)
  }

  const handleViewDetails = (check: BackgroundCheckSummary) => {
    setSelectedCheckId(check.id)
  }

  const handleRenew = (check: BackgroundCheckSummary) => {
    setSelectedCheckId(check.id)
    router.push(ROUTES.DASHBOARD.PROFILE.BACKGROUND_CHECK.INITIATE.path)
  }

  const handleDisputeNavigation = (check: BackgroundCheckSummary) => {
    if (isWeb) {
      setDisputeCheck(check)
      return
    }
    const disputePath = buildPath(ROUTES.DASHBOARD.PROFILE.BACKGROUND_CHECK.DISPUTE, {
      checkId: check.id,
    })
    router.push(disputePath)
  }

  return (
    <Stack flex={1} backgroundColor="$background">
      <ScrollView flex={1}>
        <Stack gap={16} paddingHorizontal={16} paddingBottom={24}>
          <Stack
            gap={12}
            padding="md"
            backgroundColor="$background"
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          >
            <Row gap={12} align="center">
              <ShieldCheck size={28} color="$blue10" />
              <Stack gap={4}>
                <Text color="$gray11">Background check dashboard</Text>
                <Text color="$gray11">
                  Track your screenings, monitor progress, and manage who can see your results.
                </Text>
              </Stack>
            </Row>
            <Row gap={8} flexWrap="wrap">
              {FILTER_DEFINITIONS.map((filter) => {
                const isActive = activeFilter === filter.value
                return (
                  <Button
                    key={filter.value}
                    size="sm"
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
            </Row>
          </Stack>

          {checksQuery.isLoading && (
            <Stack gap={8} align="center" paddingVertical={24}>
              <Spinner size="lg" color="$gray11" />
              <Text color="$gray11">Loading your background checks…</Text>
            </Stack>
          )}

          {checksQuery.isError && (
            <Stack
              gap={12}
              padding="md"
              backgroundColor="$color2"
              borderRadius={16}
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text color="$gray11">
                We couldn’t load your background checks. Please try again.
              </Text>
              <Button
                size="sm"
                variant="outline"
                iconStart={RefreshCcw}
                onPress={() => checksQuery.refetch()}
              >
                Retry
              </Button>
            </Stack>
          )}

          {!checksQuery.isLoading && !checksQuery.isError && filteredChecks.length === 0 && (
            <Stack
              gap={12}
              padding="md"
              backgroundColor="$color2"
              borderRadius={16}
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text color="$gray11">No background checks found for this filter.</Text>
              <Button size="sm" color="primary" onPress={handleStartNewCheck}>
                Start a background check
              </Button>
            </Stack>
          )}

          {filteredChecks.map((check: BackgroundCheckSummary) => (
            <CheckStatusCard
              key={check.id}
              check={check}
              onViewDetails={handleViewDetails}
              onRenew={handleRenew}
              onDispute={
                canDisputeStatus(check.status)
                  ? (selected) => {
                      handleDisputeNavigation(selected)
                    }
                  : undefined
              }
            />
          ))}

          <Stack
            gap={8}
            padding="sm"
            backgroundColor="$color2"
            borderRadius={16}
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Text color="$gray11">Need a new screening?</Text>
            <Text color="$gray11">
              Start a new background check whenever you need to refresh your credentials.
            </Text>
            <Button size="sm" color="primary" onPress={handleStartNewCheck}>
              Start background check
            </Button>
          </Stack>

          {selectedCheckId && (
            <Stack gap={12}>
              <Separator />
              <ResultsViewer
                checkId={selectedCheckId}
                summary={selectedCheck ?? undefined}
                onClose={() => setSelectedCheckId(null)}
                onRequestDispute={(id) => {
                  const candidate =
                    checksQuery.data?.find((item: BackgroundCheckSummary) => item.id === id) ?? null
                  if (candidate) {
                    handleDisputeNavigation(candidate)
                  }
                }}
              />
            </Stack>
          )}
        </Stack>
      </ScrollView>

      {isWeb && (
        <DisputeBackgroundCheckDialog
          open={Boolean(disputeCheck)}
          check={disputeCheck}
          onOpenChange={(open) => {
            if (!open) {
              setDisputeCheck(null)
            }
          }}
          onSubmitted={() => {
            setDisputeCheck(null)
            void checksQuery.refetch()
          }}
        />
      )}
    </Stack>
  )
}
