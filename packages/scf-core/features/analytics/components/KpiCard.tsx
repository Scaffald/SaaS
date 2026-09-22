import { MetricBlock, Row, Stack } from '@scaffald/ui'
import { SparkLine, DeltaBadge } from '@scaffald/ui/chart'
import { colors } from '@scaffald/ui/tokens'
import { StyleSheet } from 'react-native'
import type { MetricWithSparkline } from '@scaffald/sdk'

interface KpiCardProps {
  title: string
  metric: MetricWithSparkline | undefined
  isLoading?: boolean
  color?: string
}

/**
 * One analytics figure, on the shared metric block.
 *
 * It used to be a bordered card with its own 12px label and 28px figure —
 * the fourth way this app drew a stat, alongside the dashboard widgets, the
 * CCPA dashboard's `MetricCard` and the ATS metrics header. The prototype's
 * audit ("metric labels change position", "four ways to draw a stat block")
 * asks for one: label above, figure below, delta beneath.
 *
 * The sparkline survives as an adornment in the delta line rather than a
 * second column, so the label-figure-delta order holds whether or not a
 * metric has one.
 */
export function KpiCard({ title, metric, isLoading, color }: KpiCardProps) {
  const total = metric?.total ?? 0
  const previous = metric?.previous ?? 0

  if (isLoading) {
    return (
      <MetricBlock
        label={title}
        value={<Stack style={styles.skeleton} />}
        style={styles.block}
      />
    )
  }

  return (
    <MetricBlock
      label={title}
      value={total.toLocaleString()}
      delta={
        <Row align="center" gap={8}>
          <DeltaBadge current={total} previous={previous} format="percentage" />
          {metric?.sparkline && metric.sparkline.length > 0 ? (
            <SparkLine
              data={metric.sparkline}
              width={64}
              height={20}
              color={color ?? colors.primary[500]}
            />
          ) : null}
        </Row>
      }
      style={styles.block}
    />
  )
}

const styles = StyleSheet.create({
  block: {
    flex: 1,
    minWidth: 160,
  },
  skeleton: {
    height: 32,
    borderRadius: 4,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
})
