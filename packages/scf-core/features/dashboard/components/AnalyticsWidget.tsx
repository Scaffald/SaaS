import { useViewAnalytics } from '@scf/core/utils/profile-views-sdk-hooks'
import { useEngagementMetrics } from '@scf/core/utils/engagement-sdk-hooks'
import type { EngagementMetrics } from '@scaffald/sdk'
import {
  DashboardWidget,
  Row,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useResponsive,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Platform, View } from 'react-native'

function formatNumber(n: number | undefined | null): string {
  if (n == null) return '0'
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n >= 1_000) return n.toLocaleString()
  return String(n)
}

function TrendBadge({ value }: { value: number | undefined | null }) {
  const { theme } = useThemeContext()

  const v = value ?? 0
  const isPositive = v > 0
  const isNeutral = v === 0

  const color = isNeutral
    ? colors.text[theme].secondary
    : isPositive
      ? colors.emerald[600]
      : colors.error[600]

  return (
    <Text style={{ fontSize: 12, fontWeight: '700', color }}>
      {isPositive ? '+' : ''}{v}%
    </Text>
  )
}

/**
 * Web-only sparkline SVG. Returns null on native.
 */
function Sparkline({ path, color }: { path: string; color: string }) {
  if (Platform.OS !== 'web') return null

  return (
    <View style={{ height: 32, width: '100%' } as never}>
      <svg
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' } as never}
        role="img"
        aria-label="Trend sparkline"
      >
        <title>Trend sparkline</title>
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </View>
  )
}

type StatCardProps = {
  label: string
  value: string
  trend: number | undefined | null
  sparklinePath: string
}

function StatCard({ label, value, trend, sparklinePath }: StatCardProps) {
  const { theme } = useThemeContext()

  return (
    <Stack
      flex={1}
      minWidth={140}
      padding={16}
      borderRadius={16}
      gap={4}
      style={{
        backgroundColor: colors.bg[theme].subtle,
        borderWidth: 1,
        borderColor: colors.border[theme].ghost,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: colors.text[theme].secondary,
        }}
      >
        {label}
      </Text>
      <Row align="flex-end" justify="space-between">
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.text[theme].primary,
          }}
        >
          {value}
        </Text>
        <TrendBadge value={trend} />
      </Row>
      <Sparkline path={sparklinePath} color={colors.emerald[700]} />
    </Stack>
  )
}

export function AnalyticsWidget() {
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const { data: analytics, isLoading: loadingAnalytics } = useViewAnalytics()
  const { data: metrics, isLoading: loadingMetrics } = useEngagementMetrics({ days: 30 })

  const isLoading = loadingAnalytics || loadingMetrics

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={16} animation="wave">
          <Row justify="space-between" align="center">
            <Skeleton width={100} height={20} borderRadius={4} />
            <Skeleton width={80} height={16} borderRadius={4} />
          </Row>
          <Row gap={16} wrap>
            {[1, 2, 3].map((i) => (
              <Stack key={i} flex={1} minWidth={140} gap={8} padding={16}>
                <Skeleton width={100} height={12} />
                <Skeleton width={60} height={24} />
                <Skeleton width="100%" height={32} borderRadius={4} />
              </Stack>
            ))}
          </Row>
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Row justify="space-between" align="center" paddingBottom={8}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: colors.text[theme].primary,
          }}
        >
          Analytics
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: colors.primary[600],
          }}
        >
          View details
        </Text>
      </Row>
      <Row gap={16} wrap={isMobile}>
        <StatCard
          label="Profile views"
          value={formatNumber(analytics?.views30d)}
          trend={analytics?.trend}
          sparklinePath="M0,18 Q10,15 20,16 T40,10 T60,12 T80,5 T100,2"
        />
        <StatCard
          label="Search appearances"
          value={formatNumber((metrics as EngagementMetrics | undefined)?.searches)}
          trend={5}
          sparklinePath="M0,15 Q20,18 40,12 T80,8 T100,5"
        />
        <StatCard
          label="Post impressions"
          value={formatNumber((metrics as EngagementMetrics | undefined)?.profile_views)}
          trend={0}
          sparklinePath="M0,10 L20,10 L40,11 L60,9 L80,10 L100,10"
        />
      </Row>
    </DashboardWidget>
  )
}
