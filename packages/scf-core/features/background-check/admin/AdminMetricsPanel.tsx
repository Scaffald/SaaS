import type { AdminMetrics } from '@scaffald/sdk'
import { RefreshCcw } from 'lucide-react-native'
import { Button, Card, Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'

interface AdminMetricsPanelProps {
  metrics: AdminMetrics | undefined
  isLoading: boolean
  onRefresh: () => void
}

export function AdminMetricsPanel({ metrics, isLoading, onRefresh }: AdminMetricsPanelProps) {
  if (isLoading) {
    return (
      <Stack gap={12} align="center" paddingVertical={24}>
        <Spinner size="lg" />
        <Text color="$gray11">Loading metrics…</Text>
      </Stack>
    )
  }

  if (!metrics) {
    return (
      <Card
        padding="md"
        style={{ gap: 12 }}
        backgroundColor="$color2"
        borderColor="$borderColor"
        borderWidth={1}
        radius="xl"
      >
        <Text color="$gray11">Metrics unavailable</Text>
        <Text color="$gray11">
          We couldn't load the latest metrics. Try refreshing to retrieve the most recent data.
        </Text>
        <Button iconStart={RefreshCcw} onPress={onRefresh} size="sm" variant="outline">
          Refresh
        </Button>
      </Card>
    )
  }

  return (
    <Stack gap={16}>
      <Row gap={12} wrap>
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

      <Row wrap gap={12}>
        <Card
          style={{ flexGrow: 1, gap: 12 }}
          padding="md"
          backgroundColor="$color2"
          borderColor="$borderColor"
          borderWidth={1}
          radius="xl"
        >
          <Text color="$gray11">Dispute status</Text>
          <Stack gap={8}>
            <DisputeMetric label="Pending review" value={metrics.disputes.pending} tone="warning" />
            <DisputeMetric label="Under review" value={metrics.disputes.under_review} tone="info" />
            <DisputeMetric label="Resolved" value={metrics.disputes.resolved} tone="success" />
            <DisputeMetric label="Upheld" value={metrics.disputes.upheld} tone="neutral" />
          </Stack>
        </Card>

        <Card
          style={{ flexGrow: 1, gap: 12 }}
          padding="md"
          backgroundColor="$color2"
          borderColor="$borderColor"
          borderWidth={1}
          radius="xl"
        >
          <Text color="$gray11">Average completion time</Text>
          <Text color="$gray11">
            {metrics.averageCompletionDays != null ? `${metrics.averageCompletionDays} days` : '—'}
          </Text>
          <Text color="$gray11">Based on fully completed checks in the system.</Text>
        </Card>
      </Row>

      <Card
        padding="md"
        style={{ gap: 12 }}
        backgroundColor="$color2"
        borderColor="$borderColor"
        borderWidth={1}
        radius="xl"
      >
        <Row justify="space-between" align="center" wrap gap={8}>
          <Text color="$gray11">Package distribution</Text>
          <Button variant="outline" size="sm" iconStart={RefreshCcw} onPress={onRefresh}>
            Refresh
          </Button>
        </Row>
        <Stack gap={8}>
          {metrics.packageDistribution.length === 0 ? (
            <Text color="$gray11">No package usage data available yet.</Text>
          ) : (
            metrics.packageDistribution.map((item: { label: string; count: number }) => (
              <Row
                key={item.label}
                justify="space-between"
                align="center"
                paddingHorizontal={12}
                paddingVertical={8}
                backgroundColor="$color1"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius={12}
              >
                <Text color="$gray11">{item.label}</Text>
                <Text color="$gray11">{item.count}</Text>
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
      style={{ flexGrow: 1, gap: 8 }}
      padding="md"
      backgroundColor="$color2"
      borderColor="$borderColor"
      borderWidth={1}
      radius="xl"
    >
      <Text color="$gray11">{title}</Text>
      <Text color="$gray11">{value}</Text>
      <Text color="$gray11">{description}</Text>
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
    <Row justify="space-between" align="center">
      <Text color="$gray11">{label}</Text>
      <Text color={toneColors[tone]}>{value}</Text>
    </Row>
  )
}
