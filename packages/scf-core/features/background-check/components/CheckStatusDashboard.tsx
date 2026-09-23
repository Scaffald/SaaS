import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useBackgroundChecks } from '@scf/core/utils/background-checks-sdk-hooks'
import { RefreshCcw } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Platform } from 'react-native'
import {
  Button,
  Separator,
  Spinner,
  Tabs,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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
    router.push(ROUTES.PROFILE.BACKGROUND_CHECK.INITIATE.path)
  }

  const handleViewDetails = (check: BackgroundCheckSummary) => {
    setSelectedCheckId(check.id)
  }

  const handleRenew = (check: BackgroundCheckSummary) => {
    setSelectedCheckId(check.id)
    router.push(ROUTES.PROFILE.BACKGROUND_CHECK.INITIATE.path)
  }

  const handleDisputeNavigation = (check: BackgroundCheckSummary) => {
    if (isWeb) {
      setDisputeCheck(check)
      return
    }
    const disputePath = buildPath(ROUTES.PROFILE.BACKGROUND_CHECK.DISPUTE, {
      checkId: check.id,
    })
    router.push(disputePath)
  }

  // The page scrolls already; a second scroll view here made the dashboard a
  // box inside a box inside the verification accordion.
  return (
    <Stack gap={16}>
      <Text style={{ color: colors.text[t].secondary }}>
        Track your screenings, and manage who can see the results.
      </Text>

      {/* Folder tabs, the treatment the rest of the app uses for a view
          switch. These were four pill buttons that looked like actions. */}
      <Tabs
        type="folder"
        value={activeFilter}
        onValueChange={(next) => setActiveFilter(next as FilterValue)}
      >
        {FILTER_DEFINITIONS.map((filter) => (
          <Tabs.Item key={filter.value} value={filter.value}>
            <Tabs.Trigger>
              {filter.label} {counts[filter.value === 'all' ? 'total' : filter.value]}
            </Tabs.Trigger>
          </Tabs.Item>
        ))}
      </Tabs>

      {checksQuery.isLoading && (
        <Stack gap={8} align="center" paddingVertical={24}>
          <Spinner variant="ios" size="lg" color="gray" />
          <Text style={{ color: colors.text[t].secondary }}>
            Loading your background checks…
          </Text>
        </Stack>
      )}

      {checksQuery.isError && (
        <Stack gap={12} align="flex-start">
          <Text style={{ color: colors.text[t].secondary }}>
            We couldn't load your background checks. Please try again.
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
        <Stack gap={12} align="flex-start">
          <Text style={{ color: colors.text[t].secondary }}>
            {activeFilter === 'all'
              ? "You haven't had a background check run yet."
              : 'No background checks in this state.'}
          </Text>
          <Button size="sm" variant="filled" color="primary" onPress={handleStartNewCheck}>
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

      {filteredChecks.length > 0 && (
        <Row gap={12} align="center" wrap>
          <Text style={{ color: colors.text[t].secondary, flex: 1, minWidth: 200 }}>
            Screenings go stale. Start another whenever yours needs refreshing.
          </Text>
          <Button size="sm" variant="outline" onPress={handleStartNewCheck}>
            Start a check
          </Button>
        </Row>
      )}

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
