/**
 * Progression Timeline Widget - Line chart showing skill averages over time
 * Uses snapshot data to plot the overall skill trajectory.
 */

import {
  DashboardWidget,
  DashboardWidgetHeader,
  Spinner,
  Text,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { LinearChart } from '@scaffald/ui/chart'
import type { ChartDataPoint } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { useSnapshotTimeline } from '../../../utils/skill-analytics-sdk-hooks'

export function ProgressionTimelineWidget() {
  const { theme } = useThemeContext()
  const { data, isLoading, error } = useSnapshotTimeline({ limit: 12 })

  if (error) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Skill Progression" />
        <Stack gap={8} align="center" paddingVertical={24}>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 13 }}>
            Unable to load progression data
          </Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={10} align="center" paddingVertical={40}>
          <Spinner size="lg" color="primary" />
        </Stack>
      </DashboardWidget>
    )
  }

  const timeline = data?.timeline ?? []

  if (timeline.length < 2) {
    return (
      <DashboardWidget>
        <DashboardWidgetHeader title="Skill Progression" />
        <Stack gap={8} align="center" paddingVertical={24}>
          <Text style={{ color: colors.text[theme].tertiary, fontSize: 13, textAlign: 'center' }}>
            At least 2 skill snapshots are needed to show progression.{'\n'}
            Snapshots are created automatically when you receive reviews or update your
            self-assessment.
          </Text>
        </Stack>
      </DashboardWidget>
    )
  }

  const chartData: ChartDataPoint[] = timeline.map((point, index) => ({
    x: index,
    y: point.overallAverage,
    label: new Date(point.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }))

  const firstVal = timeline[0].overallAverage
  const lastVal = timeline[timeline.length - 1].overallAverage
  const delta = lastVal - firstVal
  const trendText =
    delta > 0.1
      ? `+${delta.toFixed(1)} overall`
      : delta < -0.1
        ? `${delta.toFixed(1)} overall`
        : 'Stable'
  const trendColor =
    delta > 0.1
      ? colors.green[500]
      : delta < -0.1
        ? colors.error[500]
        : colors.text[theme].tertiary

  return (
    <DashboardWidget>
      <DashboardWidgetHeader
        title="Skill Progression"
        action={
          <Text style={{ fontSize: 12, fontWeight: '600', color: trendColor }}>
            {trendText}
          </Text>
        }
      />

      <Stack paddingVertical={8}>
        <LinearChart
          data={chartData}
          height={180}
          color={colors.primary[500]}
          showShadow
        />
      </Stack>

      <Text style={{ fontSize: 11, color: colors.text[theme].tertiary, textAlign: 'center' }}>
        Overall skill average across {timeline.length} snapshots
      </Text>
    </DashboardWidget>
  )
}
