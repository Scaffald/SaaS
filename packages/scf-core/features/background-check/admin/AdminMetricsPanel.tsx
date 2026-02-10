import type { AppRouter } from '@scf/supabase/client-types'
import { RefreshCcw } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import { Button, Card, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
      <Stack gap="$3" alignItems="center" paddingVertical="$6">
        <Spinner size="large" />
        <Text fontSize="$3" color="$color10">
          Loading metrics…
        </Text>
      </Stack>
    )
  }

  if (!metrics) {
    return (
      <Card
        padding="$4"
        gap="$3"
        backgroundColor="$color2"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$4"
      >
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
    <Stack gap="$4">
      <Row gap="$3" flexWrap="wrap">
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
      </Row>

      <Separator />

      <Row flexWrap="wrap" gap="$3">
        <Card
          flexBasis={260}
          flexGrow={1}
          padding="$4"
          gap="$3"
          backgroundColor="$color2"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$4"
        >
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Dispute status
          </Text>
          <Stack gap="$2">
            <DisputeMetric label="Pending review" value={metrics.disputes.pending} tone="warning" />
            <DisputeMetric label="Under review" value={metrics.disputes.under_review} tone="info" />
            <DisputeMetric label="Resolved" value={metrics.disputes.resolved} tone="success" />
            <DisputeMetric label="Upheld" value={metrics.disputes.upheld} tone="neutral" />
          </Stack>
        </Card>

        <Card
          flexBasis={260}
          flexGrow={1}
          padding="$4"
          gap="$3"
          backgroundColor="$color2"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$4"
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
      </Row>

      <Card
        padding="$4"
        gap="$3"
        backgroundColor="$color2"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius="$4"
      >
        <Row justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Package distribution
          </Text>
          <Button variant="outlined" size="$2" icon={RefreshCcw} onPress={onRefresh}>
            Refresh
          </Button>
        </Row>
        <Stack gap="$2">
          {metrics.packageDistribution.length === 0 ? (
            <Text fontSize="$2" color="$color10">
              No package usage data available yet.
            </Text>
          ) : (
            metrics.packageDistribution.map((item: { label: string; count: number }) => (
              <Row
                key={item.label}
                justifyContent="space-between"
                alignItems="center"
                paddingHorizontal="$3"
                paddingVertical="$2"
                backgroundColor="$color1"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius="$3"
              >
                <Text fontSize="$3" color="$color12">
                  {item.label}
                </Text>
                <Text fontSize="$3" fontWeight="600" color="$color12">
                  {item.count}
                </Text>
              </Row>
            ))
          )}
        </Stack>
      </Card>
    </Stack>
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
      padding="$4"
      gap="$2"
      backgroundColor="$color2"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$4"
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
    <Row justifyContent="space-between" alignItems="center">
      <Text fontSize="$2" color="$color10">
        {label}
      </Text>
      <Text fontSize="$3" fontWeight="600" color={toneColors[tone]}>
        {value}
      </Text>
    </Row>
  )
}
