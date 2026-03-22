import { Card, Row, Stack, Text, useThemeContext } from '@scaffald/ui'
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

export function KpiCard({ title, metric, isLoading, color }: KpiCardProps) {
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'

  const total = metric?.total ?? 0
  const previous = metric?.previous ?? 0

  if (isLoading) {
    return (
      <Card variant="outlined" radius="lg" padding="md" style={styles.card}>
        <Stack gap={8}>
          <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].secondary }}>{title}</Text>
          <Stack style={styles.skeleton} />
        </Stack>
      </Card>
    )
  }

  return (
    <Card variant="outlined" radius="lg" padding="md" style={styles.card}>
      <Stack gap={8}>
        <Text style={{ fontSize: 12, color: colors.text[resolvedTheme].secondary, fontWeight: '500' }}>
          {title}
        </Text>
        <Row align="flex-end" justify="space-between">
          <Stack gap={4}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text[resolvedTheme].primary }}>
              {total.toLocaleString()}
            </Text>
            <DeltaBadge current={total} previous={previous} format="percentage" />
          </Stack>
          {metric?.sparkline && metric.sparkline.length > 0 ? (
            <SparkLine
              data={metric.sparkline}
              width={80}
              height={32}
              color={color ?? colors.primary[500]}
            />
          ) : null}
        </Row>
      </Stack>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 160,
  },
  skeleton: {
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
})
