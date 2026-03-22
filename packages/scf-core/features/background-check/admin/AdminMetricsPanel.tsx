import type { AdminMetrics } from '@scaffald/sdk'
import { RefreshCcw } from 'lucide-react-native'
import { Button, Card, Separator, Spinner, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface AdminMetricsPanelProps {
  metrics: AdminMetrics | undefined
  isLoading: boolean
  onRefresh: () => void
}

export function AdminMetricsPanel({ metrics, isLoading, onRefresh }: AdminMetricsPanelProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  if (isLoading) {
    return (
      <Stack gap={12} align="center" paddingVertical={24}>
        <Spinner variant="ios" size="lg" />
        <Text style={{ color: colors.text[t].secondary }}>Loading metrics…</Text>
      </Stack>
    )
  }

  if (!metrics) {
    return (
      <Card
        padding="md"
        style={{ gap: 12, backgroundColor: colors.bg[t].subtle, borderColor: colors.border[t].default }}
        borderWidth={1}
        radius="xl"
      >
        <Text style={{ color: colors.text[t].secondary }}>Metrics unavailable</Text>
        <Text style={{ color: colors.text[t].secondary }}>
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
          t={t}
          title="Checks in system"
          value={metrics.totals.checks}
          description="Total background checks tracked"
        />
        <MetricCard
          t={t}
          title="Under review"
          value={metrics.totals.under_review}
          description="Checks awaiting admin review"
        />
        <MetricCard
          t={t}
          title="Active disputes"
          value={metrics.totals.disputed}
          description="Checks escalated for dispute resolution"
        />
        <MetricCard
          t={t}
          title="Completed screenings"
          value={metrics.totals.completed}
          description="Checks completed and ready to share"
        />
      </Row>

      <Separator />

      <Row wrap gap={12}>
        <Card
          style={{ flexGrow: 1, gap: 12, backgroundColor: colors.bg[t].subtle, borderColor: colors.border[t].default }}
          padding="md"
          borderWidth={1}
          radius="xl"
        >
          <Text style={{ color: colors.text[t].secondary }}>Dispute status</Text>
          <Stack gap={8}>
            <DisputeMetric t={t} label="Pending review" value={metrics.disputes.pending} tone="warning" />
            <DisputeMetric t={t} label="Under review" value={metrics.disputes.under_review} tone="info" />
            <DisputeMetric t={t} label="Resolved" value={metrics.disputes.resolved} tone="success" />
            <DisputeMetric t={t} label="Upheld" value={metrics.disputes.upheld} tone="neutral" />
          </Stack>
        </Card>

        <Card
          style={{ flexGrow: 1, gap: 12, backgroundColor: colors.bg[t].subtle, borderColor: colors.border[t].default }}
          padding="md"
          borderWidth={1}
          radius="xl"
        >
          <Text style={{ color: colors.text[t].secondary }}>Average completion time</Text>
          <Text style={{ color: colors.text[t].secondary }}>
            {metrics.averageCompletionDays != null ? `${metrics.averageCompletionDays} days` : '—'}
          </Text>
          <Text style={{ color: colors.text[t].secondary }}>Based on fully completed checks in the system.</Text>
        </Card>
      </Row>

      <Card
        padding="md"
        style={{ gap: 12, backgroundColor: colors.bg[t].subtle, borderColor: colors.border[t].default }}
        borderWidth={1}
        radius="xl"
      >
        <Row justify="space-between" align="center" wrap gap={8}>
          <Text style={{ color: colors.text[t].secondary }}>Package distribution</Text>
          <Button variant="outline" size="sm" iconStart={RefreshCcw} onPress={onRefresh}>
            Refresh
          </Button>
        </Row>
        <Stack gap={8}>
          {metrics.packageDistribution.length === 0 ? (
            <Text style={{ color: colors.text[t].secondary }}>No package usage data available yet.</Text>
          ) : (
            metrics.packageDistribution.map((item: { label: string; count: number }) => (
              <Row
                key={item.label}
                justify="space-between"
                align="center"
                paddingHorizontal={12}
                paddingVertical={8}
                style={{ backgroundColor: colors.bg[t].default, borderColor: colors.border[t].default }}
                borderWidth={1}
                borderRadius={12}
              >
                <Text style={{ color: colors.text[t].secondary }}>{item.label}</Text>
                <Text style={{ color: colors.text[t].secondary }}>{item.count}</Text>
              </Row>
            ))
          )}
        </Stack>
      </Card>
    </Stack>
  )
}

interface MetricCardProps {
  t: 'light' | 'dark'
  title: string
  value: number
  description: string
}

function MetricCard({ t, title, value, description }: MetricCardProps) {
  return (
    <Card
      style={{ flexGrow: 1, gap: 8, backgroundColor: colors.bg[t].subtle, borderColor: colors.border[t].default }}
      padding="md"
      borderWidth={1}
      radius="xl"
    >
      <Text style={{ color: colors.text[t].secondary }}>{title}</Text>
      <Text style={{ color: colors.text[t].secondary }}>{value}</Text>
      <Text style={{ color: colors.text[t].secondary }}>{description}</Text>
    </Card>
  )
}

interface DisputeMetricProps {
  t: 'light' | 'dark'
  label: string
  value: number
  tone: 'info' | 'warning' | 'success' | 'neutral'
}

function DisputeMetric({ t, label, value, tone }: DisputeMetricProps) {
  const toneColorMap = {
    info: colors.text[t].primary,
    warning: colors.fg[t].warning,
    success: colors.fg[t].success,
    neutral: colors.text[t].tertiary,
  } as const

  return (
    <Row justify="space-between" align="center">
      <Text style={{ color: colors.text[t].secondary }}>{label}</Text>
      <Text style={{ color: toneColorMap[tone] }}>{value}</Text>
    </Row>
  )
}
