import { useMemo } from 'react'
import { Calendar, AlertTriangle } from 'lucide-react'
import { Stack, Row, Text, H2, H3, Card, Grid } from '@scaffald/ui'
import { PolicyData } from '../../types'

interface RenewalForecastWidgetProps {
  policies: PolicyData[]
}

interface ForecastData {
  month: string
  count: number
  value: number
}

export default function RenewalForecastWidget({ policies }: RenewalForecastWidgetProps) {
  const forecastData = useMemo(() => {
    const today = new Date()
    const next6Months: ForecastData[] = []

    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1)
      const monthName = monthDate.toLocaleDateString('en-US', {
        month: 'short',
      })

      const monthPolicies = policies.filter((policy) => {
        const endDate = new Date(policy.end_date)
        return (
          endDate.getMonth() === monthDate.getMonth() &&
          endDate.getFullYear() === monthDate.getFullYear()
        )
      })

      next6Months.push({
        month: monthName,
        count: monthPolicies.length,
        value: monthPolicies.reduce((sum, p) => sum + (p.premium_amount || 0), 0),
      })
    }

    return next6Months
  }, [policies])

  const maxCount = Math.max(...forecastData.map((d) => d.count), 1)
  const expiringThisMonth = forecastData[0]?.count || 0
  const expiringNextMonth = forecastData[1]?.count || 0

  const policyTypeBreakdown = useMemo(() => {
    const next30Days = new Date()
    next30Days.setDate(next30Days.getDate() + 30)

    const upcoming = policies.filter((policy) => {
      const endDate = new Date(policy.end_date)
      return endDate <= next30Days && endDate >= new Date()
    })

    const breakdown: { [key: string]: number } = {}
    upcoming.forEach((policy) => {
      const type = policy.policy_type.replace('_', ' ')
      breakdown[type] = (breakdown[type] || 0) + 1
    })

    return Object.entries(breakdown).map(([type, count]) => ({
      type,
      count,
      percentage: (count / upcoming.length) * 100,
    }))
  }, [policies])

  const getPolicyTypeColor = (index: number) => {
    const colors = [
      'var(--color-blue-9)',
      'var(--color-purple-9)',
      'var(--color-green-9)',
      'var(--color-yellow-9)',
      'var(--color-red-9)',
      'var(--color-gray-9)',
    ]
    return colors[index % colors.length]
  }

  const getBarColor = (index: number) => {
    if (index === 0) return 'var(--color-red-9)'
    if (index === 1) return 'var(--color-yellow-9)'
    return 'var(--color-blue-9)'
  }

  return (
    <Card
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
        padding: 24,
      }}
    >
      <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 24 }}>
        <Stack>
          <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
            Renewal Forecast
          </H2>
          <Text size="sm" muted>
            Policy expirations over next 6 months
          </Text>
        </Stack>
        <Row alignItems="center" gap={8}>
          <AlertTriangle size={18} style={{ color: 'var(--color-yellow-10)' }} />
          <Text size="sm" muted>
            {expiringThisMonth} expiring this month
          </Text>
        </Row>
      </Row>

      <Grid columns={{ base: 1, lg: 2 }} gap={24}>
        <Stack>
          <H3
            style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 16 }}
          >
            Monthly Expirations
          </H3>
          <Stack gap={12}>
            {forecastData.map((data, index) => (
              <Row key={data.month} alignItems="center" gap={12}>
                <Text size="sm" weight="medium" muted style={{ width: 64 }}>
                  {data.month}
                </Text>
                <Stack style={{ flex: 1 }}>
                  <Row alignItems="center" gap={8}>
                    <Stack
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--color-gray-6)',
                        borderRadius: 9999,
                        height: 24,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Stack
                        style={{
                          height: 24,
                          borderRadius: 9999,
                          backgroundColor: getBarColor(index),
                          width: `${(data.count / maxCount) * 100}%`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {data.count > 0 && (
                          <Text
                            size="xs"
                            weight="medium"
                            style={{ color: 'white', paddingLeft: 8, paddingRight: 8 }}
                          >
                            {data.count}
                          </Text>
                        )}
                      </Stack>
                    </Stack>
                    <Text size="sm" muted style={{ width: 80, textAlign: 'right' }}>
                      ${(data.value / 1000).toFixed(0)}K
                    </Text>
                  </Row>
                </Stack>
              </Row>
            ))}
          </Stack>
        </Stack>

        <Stack>
          <H3
            style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 16 }}
          >
            Next 30 Days by Type
          </H3>
          {policyTypeBreakdown.length > 0 ? (
            <Stack gap={16}>
              {policyTypeBreakdown.map((item, index) => (
                <Stack key={item.type}>
                  <Row
                    alignItems="center"
                    justifyContent="space-between"
                    style={{ marginBottom: 4 }}
                  >
                    <Text
                      size="sm"
                      style={{ textTransform: 'capitalize', color: 'var(--color-text)' }}
                    >
                      {item.type}
                    </Text>
                    <Text size="sm" weight="medium" muted>
                      {item.count} ({item.percentage.toFixed(0)}%)
                    </Text>
                  </Row>
                  <Stack
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--color-gray-6)',
                      borderRadius: 9999,
                      height: 8,
                    }}
                  >
                    <Stack
                      style={{
                        height: 8,
                        borderRadius: 9999,
                        backgroundColor: getPolicyTypeColor(index),
                        width: `${item.percentage}%`,
                      }}
                    />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Stack
              alignItems="center"
              justifyContent="center"
              style={{ paddingTop: 32, paddingBottom: 32 }}
            >
              <Calendar size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 12 }} />
              <Text size="sm" muted>
                No policies expiring in next 30 days
              </Text>
            </Stack>
          )}
        </Stack>
      </Grid>

      <Stack style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
        <Grid columns={{ base: 1, sm: 3 }} gap={16}>
          <Stack style={{ alignItems: 'center' }}>
            <Text size="xl" weight="bold">
              {expiringThisMonth}
            </Text>
            <Text size="sm" muted>
              This Month
            </Text>
          </Stack>
          <Stack style={{ alignItems: 'center' }}>
            <Text size="xl" weight="bold">
              {expiringNextMonth}
            </Text>
            <Text size="sm" muted>
              Next Month
            </Text>
          </Stack>
          <Stack style={{ alignItems: 'center' }}>
            <Text size="xl" weight="bold">
              {forecastData.reduce((sum, d) => sum + d.count, 0)}
            </Text>
            <Text size="sm" muted>
              6 Months Total
            </Text>
          </Stack>
        </Grid>
      </Stack>
    </Card>
  )
}
