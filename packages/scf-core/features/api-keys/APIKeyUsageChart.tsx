/**
 * API Key Usage Analytics Dashboard
 * Displays usage metrics and charts for API keys
 */

import { useState } from 'react'
import {
  Button,
  Card,
  H3,
  H4,
  Paragraph,
  Separator,
  Spinner,
  Row,
  Stack,
} from '@scaffald/ui'
import {
  Activity,
  AlertCircle,
  ArrowDown,
  BarChart3,
  CheckCircle,
  Clock,
  TrendingUp,
  XCircle,
} from 'lucide-react-native'
import { format } from 'date-fns'
import { useAPIKeyUsage } from './hooks'

export interface APIKeyUsageData {
  apiKeyId: string
  apiKeyName: string
  metrics: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    requestsToday: number
    requestsThisWeek: number
    requestsThisMonth: number
  }
  rateLimitInfo: {
    limit: number
    remaining: number
    resetAt: string
    tier: 'free' | 'pro' | 'enterprise'
  }
  timeSeriesData: Array<{
    date: string
    requests: number
    errors: number
    avgResponseTime: number
  }>
  endpointBreakdown: Array<{
    endpoint: string
    method: string
    count: number
    avgResponseTime: number
    errorRate: number
  }>
  statusCodeBreakdown: Record<string, number>
}

export interface APIKeyUsageChartProps {
  apiKeyId: string
  onClose?: () => void
}

const TIME_RANGES = [
  { label: '24 Hours', value: 1 },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
]

export function APIKeyUsageChart({ apiKeyId, onClose }: APIKeyUsageChartProps) {
  const [timeRange, setTimeRange] = useState(7)

  // Fetch usage data from API
  const { data: usageData, isLoading } = useAPIKeyUsage(apiKeyId, timeRange)

  // Transform API data to component format
  const data: APIKeyUsageData | null = usageData
    ? {
        apiKeyId,
        apiKeyName: 'API Key',
        metrics: {
          totalRequests: usageData.total_requests,
          successfulRequests: usageData.success_requests,
          failedRequests: usageData.error_requests,
          averageResponseTime: usageData.avg_response_time_ms,
          requestsToday: calculateRequestsInPeriod(usageData.usage, 1),
          requestsThisWeek: calculateRequestsInPeriod(usageData.usage, 7),
          requestsThisMonth: usageData.total_requests,
        },
        rateLimitInfo: {
          limit: 1000,
          remaining: Math.max(0, 1000 - calculateRequestsInPeriod(usageData.usage, 1)),
          resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          tier: 'pro',
        },
        timeSeriesData: calculateTimeSeriesData(usageData.usage, timeRange),
        endpointBreakdown: calculateEndpointBreakdown(usageData.usage),
        statusCodeBreakdown: calculateStatusCodeBreakdown(usageData.usage),
      }
    : null

  // Helper function to calculate requests in a time period
  function calculateRequestsInPeriod(usage: Array<{ timestamp: string }>, days: number): number {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return usage.filter((u) => new Date(u.timestamp) >= cutoff).length
  }

  // Helper function to calculate time series data
  function calculateTimeSeriesData(
    usage: Array<{
      timestamp: string
      status_code: number
      response_time_ms: number | null
    }>,
    days: number
  ): Array<{ date: string; requests: number; errors: number; avgResponseTime: number }> {
    const series: Record<string, { requests: number; errors: number; totalResponseTime: number }> =
      {}

    // Group by date
    usage.forEach((u) => {
      const date = format(new Date(u.timestamp), 'MMM dd')
      if (!series[date]) {
        series[date] = { requests: 0, errors: 0, totalResponseTime: 0 }
      }
      series[date].requests++
      if (u.status_code >= 400) {
        series[date].errors++
      }
      series[date].totalResponseTime += u.response_time_ms || 0
    })

    // Convert to array and calculate averages
    return Object.entries(series)
      .map(([date, stats]) => ({
        date,
        requests: stats.requests,
        errors: stats.errors,
        avgResponseTime: Math.round(stats.totalResponseTime / stats.requests),
      }))
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${new Date().getFullYear()}`)
        const dateB = new Date(`${b.date} ${new Date().getFullYear()}`)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-days)
  }

  // Helper function to calculate endpoint breakdown
  function calculateEndpointBreakdown(
    usage: Array<{
      endpoint: string
      method: string
      status_code: number
      response_time_ms: number | null
    }>
  ): Array<{
    endpoint: string
    method: string
    count: number
    avgResponseTime: number
    errorRate: number
  }> {
    const breakdown: Record<
      string,
      {
        method: string
        count: number
        errors: number
        totalResponseTime: number
      }
    > = {}

    usage.forEach((u) => {
      const key = `${u.method}:${u.endpoint}`
      if (!breakdown[key]) {
        breakdown[key] = {
          method: u.method,
          count: 0,
          errors: 0,
          totalResponseTime: 0,
        }
      }
      breakdown[key].count++
      if (u.status_code >= 400) {
        breakdown[key].errors++
      }
      breakdown[key].totalResponseTime += u.response_time_ms || 0
    })

    // Convert to array and calculate metrics
    return Object.entries(breakdown)
      .map(([endpoint, stats]) => ({
        endpoint: endpoint.split(':')[1],
        method: stats.method,
        count: stats.count,
        avgResponseTime: Math.round(stats.totalResponseTime / stats.count),
        errorRate: Number.parseFloat(((stats.errors / stats.count) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 endpoints
  }

  // Helper function to calculate status code breakdown
  function calculateStatusCodeBreakdown(
    usage: Array<{ status_code: number }>
  ): Record<string, number> {
    const breakdown: Record<string, number> = {}

    usage.forEach((u) => {
      const code = String(u.status_code)
      breakdown[code] = (breakdown[code] || 0) + 1
    })

    return breakdown
  }

  const successRate = data
    ? ((data.metrics.successfulRequests / data.metrics.totalRequests) * 100).toFixed(2)
    : '0'

  const getRateLimitPercentage = () => {
    if (!data) return 0
    return ((data.rateLimitInfo.remaining / data.rateLimitInfo.limit) * 100).toFixed(0)
  }

  const getRateLimitColor = () => {
    const percentage = parseInt(getRateLimitPercentage(), 10)
    if (percentage > 50) return '$green10'
    if (percentage > 20) return '$orange10'
    return '$red10'
  }

  if (isLoading) {
    return (
      <Stack flex={1} justify="center" align="center" padding={32}>
        <Spinner size="lg" color="$blue10" />
        <Paragraph mt={16} color="$gray11">
          Loading usage analytics...
        </Paragraph>
      </Stack>
    )
  }

  if (!data) {
    return (
      <Card padded bordered>
        <Stack align="center" gap={16} padding="xl">
          <AlertCircle size={48} color="$gray9" />
          <Stack align="center" gap={8}>
            <H4>No Data Available</H4>
            <Paragraph color="$gray11" textAlign="center">
              Unable to load usage analytics for this API key
            </Paragraph>
          </Stack>
        </Stack>
      </Card>
    )
  }

  return (
    <Stack flex={1} gap={16}>
      {/* Header */}
      <Row justify="space-between" align="center">
        <Stack gap={8}>
          <H3>API Key Usage Analytics</H3>
          <Paragraph color="$gray11">{data.apiKeyName}</Paragraph>
        </Stack>
        {onClose && (
          <Button variant="outline" onPress={onClose}>
            Close
          </Button>
        )}
      </Row>

      <Separator />

      {/* Time Range Selector */}
      <Row gap={8}>
        {TIME_RANGES.map((range) => (
          <Button
            key={range.value}
            size="sm"
            variant={timeRange === range.value ? 'outlined' : 'outlined'}
            theme={timeRange === range.value ? 'blue' : undefined}
            onPress={() => setTimeRange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </Row>

      {/* Key Metrics */}
      <Row gap={12} wrap>
        {/* Total Requests */}
        <Card flex={1} minWidth={200} padded bordered>
          <Stack gap={12}>
            <Row justify="space-between" align="center">
              <Paragraph size="sm" color="$gray11">
                Total Requests
              </Paragraph>
              <Activity size="lg" color="$blue10" />
            </Row>
            <H3>{data.metrics.totalRequests.toLocaleString()}</H3>
            <Row align="center" gap={8}>
              <TrendingUp size="md" color="$green10" />
              <Paragraph size="sm" color="$green10">
                +12% from last period
              </Paragraph>
            </Row>
          </Stack>
        </Card>

        {/* Success Rate */}
        <Card flex={1} minWidth={200} padded bordered>
          <Stack gap={12}>
            <Row justify="space-between" align="center">
              <Paragraph size="sm" color="$gray11">
                Success Rate
              </Paragraph>
              <CheckCircle size="lg" color="$green10" />
            </Row>
            <H3>{successRate}%</H3>
            <Row align="center" gap={8}>
              <Paragraph size="sm" color="$gray11">
                {data.metrics.successfulRequests.toLocaleString()} successful
              </Paragraph>
            </Row>
          </Stack>
        </Card>

        {/* Avg Response Time */}
        <Card flex={1} minWidth={200} padded bordered>
          <Stack gap={12}>
            <Row justify="space-between" align="center">
              <Paragraph size="sm" color="$gray11">
                Avg Response Time
              </Paragraph>
              <Clock size="lg" color="$orange10" />
            </Row>
            <H3>{data.metrics.averageResponseTime}ms</H3>
            <Row align="center" gap={8}>
              <ArrowDown size="md" color="$green10" />
              <Paragraph size="sm" color="$green10">
                8% faster
              </Paragraph>
            </Row>
          </Stack>
        </Card>

        {/* Errors */}
        <Card flex={1} minWidth={200} padded bordered>
          <Stack gap={12}>
            <Row justify="space-between" align="center">
              <Paragraph size="sm" color="$gray11">
                Failed Requests
              </Paragraph>
              <XCircle size="lg" color="$red10" />
            </Row>
            <H3>{data.metrics.failedRequests}</H3>
            <Row align="center" gap={8}>
              <Paragraph size="sm" color="$gray11">
                {((data.metrics.failedRequests / data.metrics.totalRequests) * 100).toFixed(2)}%
                error rate
              </Paragraph>
            </Row>
          </Stack>
        </Card>
      </Row>

      {/* Rate Limit Status */}
      <Card bordered padding="md" backgroundColor="$blue2">
        <Stack gap={12}>
          <Row justify="space-between" align="center">
            <H4>Rate Limit Status</H4>
            <Card
              backgroundColor={getRateLimitColor()}
              paddingHorizontal={12}
              paddingVertical={4}
              borderRadius={12}
            >
              <Paragraph size="sm" color="$gray12">
                {data.rateLimitInfo.tier.toUpperCase()}
              </Paragraph>
            </Card>
          </Row>

          <Row align="center" gap={16}>
            <Stack flex={1} gap={8}>
              <Row justify="space-between">
                <Paragraph size="sm" color="$gray11">
                  Remaining
                </Paragraph>
                <Paragraph size="sm">
                  {data.rateLimitInfo.remaining} / {data.rateLimitInfo.limit}
                </Paragraph>
              </Row>

              {/* Progress Bar */}
              <Card height={8} backgroundColor="$gray4" borderRadius="$10" overflow="hidden">
                <Card
                  height="100%"
                  width={`${getRateLimitPercentage()}%`}
                  backgroundColor={getRateLimitColor()}
                />
              </Card>

              <Paragraph size="sm" color="$gray11">
                Resets {format(new Date(data.rateLimitInfo.resetAt), 'h:mm a')}
              </Paragraph>
            </Stack>
          </Row>
        </Stack>
      </Card>

      {/* Requests Timeline (Simple visualization) */}
      <Card bordered padding="md">
        <Stack gap={16}>
          <Row justify="space-between" align="center">
            <H4>Request Volume</H4>
            <BarChart3 size="lg" color="$blue10" />
          </Row>

          {/* Simple bar chart */}
          <Stack gap={8}>
            {data.timeSeriesData.slice(-7).map((day, index) => {
              const maxRequests = Math.max(...data.timeSeriesData.map((d) => d.requests))
              const percentage = (day.requests / maxRequests) * 100

              return (
                <Stack key={index} gap={4}>
                  <Row justify="space-between" align="center">
                    <Paragraph size="sm" color="$gray11" minWidth={60}>
                      {day.date}
                    </Paragraph>
                    <Card
                      flex={1}
                      height={24}
                      backgroundColor="$gray3"
                      borderRadius={8}
                      overflow="hidden"
                      mx={8}
                    >
                      <Card height="100%" width={`${percentage}%`} backgroundColor="$blue8" />
                    </Card>
                    <Paragraph size="sm" minWidth={50} textAlign="right">
                      {day.requests}
                    </Paragraph>
                  </Row>
                </Stack>
              )
            })}
          </Stack>
        </Stack>
      </Card>

      {/* Endpoint Breakdown */}
      <Card bordered padding="md">
        <Stack gap={16}>
          <H4>Top Endpoints</H4>

          <Stack gap={8}>
            {data.endpointBreakdown.map((endpoint, index) => (
              <Card key={index} backgroundColor="$gray2" padding="sm" borderRadius={12}>
                <Stack gap={8}>
                  <Row justify="space-between" align="center">
                    <Stack flex={1}>
                      <Row align="center" gap={8}>
                        <Card
                          backgroundColor={
                            endpoint.method === 'GET'
                              ? '$blue3'
                              : endpoint.method === 'POST'
                                ? '$green3'
                                : '$orange3'
                          }
                          paddingHorizontal={8}
                          paddingVertical={4}
                          borderRadius={8}
                        >
                          <Paragraph
                            size="sm"
                            color={
                              endpoint.method === 'GET'
                                ? '$blue11'
                                : endpoint.method === 'POST'
                                  ? '$green11'
                                  : '$orange11'
                            }
                          >
                            {endpoint.method}
                          </Paragraph>
                        </Card>
                        <Paragraph fontFamily="$mono" size="sm">
                          {endpoint.endpoint}
                        </Paragraph>
                      </Row>
                    </Stack>
                    <Paragraph>{endpoint.count.toLocaleString()}</Paragraph>
                  </Row>

                  <Row gap={16}>
                    <Paragraph size="sm" color="$gray11">
                      Avg: {endpoint.avgResponseTime}ms
                    </Paragraph>
                    <Paragraph size="sm" color={endpoint.errorRate > 1 ? '$red11' : '$gray11'}>
                      Error: {endpoint.errorRate}%
                    </Paragraph>
                  </Row>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Stack>
      </Card>

      {/* Status Code Breakdown */}
      <Card bordered padding="md">
        <Stack gap={16}>
          <H4>Status Codes</H4>

          <Row gap={8} wrap>
            {Object.entries(data.statusCodeBreakdown).map(([code, count]) => {
              const isSuccess = code.startsWith('2')
              const isClientError = code.startsWith('4')
              const _isServerError = code.startsWith('5')

              return (
                <Card
                  key={code}
                  backgroundColor={isSuccess ? '$green2' : isClientError ? '$orange2' : '$red2'}
                  borderColor={isSuccess ? '$green6' : isClientError ? '$orange6' : '$red6'}
                  borderWidth={1}
                  padding="sm"
                  borderRadius={12}
                  minWidth={100}
                >
                  <Stack gap={4} align="center">
                    <Paragraph
                      size="sm"
                      color={isSuccess ? '$green11' : isClientError ? '$orange11' : '$red11'}
                    >
                      {code}
                    </Paragraph>
                    <Paragraph>{count.toLocaleString()}</Paragraph>
                  </Stack>
                </Card>
              )
            })}
          </Row>
        </Stack>
      </Card>
    </Stack>
  )
}
