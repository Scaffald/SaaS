import type { AppRouter } from '@app/supabase/client-types'
import { RefreshCcw } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { Button, Card, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

type RouterOutputs = inferRouterOutputs<AppRouter>
type MetricsSummary = RouterOutputs['backgroundChecks']['adminGetMetrics']

interface AdminMetricsPanelProps {
  metrics: MetricsSummary | undefined
  isLoading: boolean
  onRefresh: () => void
}

export function AdminMetricsPanel({ metrics, isLoading, onRefresh }: AdminMetricsPanelProps) {
  if (isLoading) {
    return (
      <YStack gap="$3" items="center" py="$6">
        <Spinner size="large" />
        <Text fontSize="$3" color="$color10">
          Loading metrics…
        </Text>
      </YStack>
    )
  }

  if (!metrics) {
    return (
      <Card p="$4" gap="$3" bg="$color2" borderColor="$borderColor" borderWidth={1} rounded="$4">
        <Text fontSize="$4" fontWeight="600" color="$color12">
          Metrics unavailable
        </Text>
        <Text fontSize="$2" color="$color10">
          We couldn’t load the latest metrics. Try refreshing to retrieve the most recent data.
        </Text>
        <Button icon={RefreshCcw} onPress={onRefresh} size="$3" variant="outlined">
          Refresh
        </Button>
      </Card>
    )
  }

  return (
    <YStack gap="$4">
      <XStack gap="$3" flexWrap="wrap">
        <MetricCard
          title="Checks in system"
          value={metrics.totals.checks}
          description="Total background checks tracked"
        />
        <MetricCard
          title="Under review"
          value={metrics.totals.under_review}
          description="Checks awaiting admin review"
        />
        <MetricCard
          title="Active disputes"
          value={metrics.totals.disputed}
          description="Checks escalated for dispute resolution"
        />
        <MetricCard
          title="Completed screenings"
          value={metrics.totals.completed}
          description="Checks completed and ready to share"
        />
      </XStack>

      <Separator />

      <XStack flexWrap="wrap" gap="$3">
        <Card
          flexBasis={260}
          flexGrow={1}
          p="$4"
          gap="$3"
          bg="$color2"
          borderColor="$borderColor"
          borderWidth={1}
          rounded="$4"
        >
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Dispute status
          </Text>
          <YStack gap="$2">
            <DisputeMetric label="Pending review" value={metrics.disputes.pending} tone="warning" />
            <DisputeMetric label="Under review" value={metrics.disputes.under_review} tone="info" />
            <DisputeMetric label="Resolved" value={metrics.disputes.resolved} tone="success" />
            <DisputeMetric label="Upheld" value={metrics.disputes.upheld} tone="neutral" />
          </YStack>
        </Card>

        <Card
          flexBasis={260}
          flexGrow={1}
          p="$4"
          gap="$3"
          bg="$color2"
          borderColor="$borderColor"
          borderWidth={1}
          rounded="$4"
        >
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Average completion time
          </Text>
          <Text fontSize="$7" fontWeight="700" color="$color12">
            {metrics.averageCompletionDays != null ? `${metrics.averageCompletionDays} days` : '—'}
          </Text>
          <Text fontSize="$2" color="$color10">
            Based on fully completed checks in the system.
          </Text>
        </Card>
      </XStack>

      <Card p="$4" gap="$3" bg="$color2" borderColor="$borderColor" borderWidth={1} rounded="$4">
        <XStack justify="space-between" items="center" flexWrap="wrap" gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Package distribution
          </Text>
          <Button variant="outlined" size="$2" icon={RefreshCcw} onPress={onRefresh}>
            Refresh
          </Button>
        </XStack>
        <YStack gap="$2">
          {metrics.packageDistribution.length === 0 ? (
            <Text fontSize="$2" color="$color10">
              No package usage data available yet.
            </Text>
          ) : (
            metrics.packageDistribution.map((item: { label: string; count: number }) => (
              <XStack
                key={item.label}
                justify="space-between"
                items="center"
                px="$3"
                py="$2"
                bg="$color1"
                borderColor="$borderColor"
                borderWidth={1}
                rounded="$3"
              >
                <Text fontSize="$3" color="$color12">
                  {item.label}
                </Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {item.count}
                </Text>
              </XStack>
            ))
          )}
        </YStack>
      </Card>
    </YStack>
  )
}

interface MetricCardProps {
  title: string
  value: number
  description: string
}

function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <Card
      flexBasis={200}
      flexGrow={1}
      p="$4"
      gap="$2"
      bg="$color2"
      borderColor="$borderColor"
      borderWidth={1}
      rounded="$4"
    >
      <Text fontSize="$2" color="$color10">
        {title}
      </Text>
      <Text fontSize="$7" fontWeight="700" color="$color12">
        {value}
      </Text>
      <Text fontSize="$2" color="$color10">
        {description}
      </Text>
    </Card>
  )
}

interface DisputeMetricProps {
  label: string
  value: number
  tone: 'info' | 'warning' | 'success' | 'neutral'
}

function DisputeMetric({ label, value, tone }: DisputeMetricProps) {
  const toneColors = {
    info: '$blue11',
    warning: '$yellow11',
    success: '$green11',
    neutral: '$color10',
  } as const

  return (
    <XStack justify="space-between" items="center">
      <Text fontSize="$2" color="$color10">
        {label}
      </Text>
      <Text fontSize="$3" fontWeight="600" color={toneColors[tone]}>
        {value}
      </Text>
    </XStack>
  )
}
