import { useViewAnalytics } from '@scf/core/utils/profile-views-sdk-hooks'
import {
  Button,
  DashboardWidget,
  DashboardWidgetHeader,
  Row,
  Skeleton,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import Svg, { Path } from 'react-native-svg'

type StatCardData = {
  label: string
  value: string
  trend: number
  sparklinePath: string
}

function TrendBadge({ trend }: { trend: number }) {
  const color =
    trend > 0
      ? colors.emerald[600]
      : trend < 0
        ? colors.error[600]
        : colors.gray[500]
  const prefix = trend > 0 ? '+' : ''
  return (
    <Text style={{ fontSize: 12, fontWeight: '700', color }}>
      {prefix}{trend}%
    </Text>
  )
}

function StatCard({ card }: { card: StatCardData }) {
  const { theme } = useThemeContext()
  return (
    <Stack
      flex={1}
      padding={16}
      borderRadius={16}
      gap={4}
      style={{
        backgroundColor: colors.bg[theme].muted,
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
        {card.label}
      </Text>
      <Row justify="space-between" align="flex-end">
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: colors.text[theme].primary,
          }}
        >
          {card.value}
        </Text>
        <TrendBadge trend={card.trend} />
      </Row>
      <Svg
        width="100%"
        height={32}
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        style={{ marginTop: 4 }}
      >
        <Path
          d={card.sparklinePath}
          stroke={colors.primary[600]}
          strokeWidth={2}
          fill="none"
        />
      </Svg>
    </Stack>
  )
}

function formatCount(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n >= 1_000) return n.toLocaleString()
  return String(n)
}

/**
 * AnalyticsWidget
 * Shows profile views, search appearances, and post impressions
 * with trend indicators and mini sparklines.
 */
export function AnalyticsWidget() {
  const { data: viewAnalytics, isLoading } = useViewAnalytics()

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={16} animation="wave">
          <Row justify="space-between" align="center">
            <Skeleton width={100} height={22} borderRadius={4} />
            <Skeleton width={80} height={16} borderRadius={4} />
          </Row>
          <Row gap={16}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={120} borderRadius={16} style={{ flex: 1 }} />
            ))}
          </Row>
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  const cards: StatCardData[] = [
    {
      label: 'Profile views',
      value: formatCount(viewAnalytics?.views30d ?? 0),
      trend: viewAnalytics?.trend ?? 0,
      sparklinePath: 'M0,18 Q10,15 20,16 T40,10 T60,12 T80,5 T100,2',
    },
    {
      label: 'Search appearances',
      value: formatCount(0),
      trend: 0,
      sparklinePath: 'M0,15 Q20,18 40,12 T80,8 T100,5',
    },
    {
      label: 'Post impressions',
      value: formatCount(0),
      trend: 0,
      sparklinePath: 'M0,10 L20,10 L40,11 L60,9 L80,10 L100,10',
    },
  ]

  return (
    <DashboardWidget>
      <DashboardWidgetHeader
        title="Analytics"
        action={
          <Button variant="text" color="primary" size="sm">
            View details
          </Button>
        }
      />
      <Row gap={16}>
        {cards.map((card) => (
          <StatCard key={card.label} card={card} />
        ))}
      </Row>
    </DashboardWidget>
  )
}
