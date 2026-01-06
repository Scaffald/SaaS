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
  XStack,
  YStack,
} from '@unicornlove/ui'
import {
  Activity,
  AlertCircle,
  ArrowDown,
  BarChart3,
  CheckCircle,
  Clock,
  TrendingUp,
  XCircle,
} from '@tamagui/lucide-icons'
import { format } from 'date-fns'
import { useAPIKeyUsage } from './hooks'

interface APIKeyUsageData {
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

interface APIKeyUsageChartProps {
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
  // Note: Some analytics features (endpoint breakdown, time series, rate limits)
  // are not yet available from the API and use mock data
  const data: APIKeyUsageData | null = usageData
    ? {
        apiKeyId,
        apiKeyName: 'API Key', // TODO: Get from API keys list
        metrics: {
          totalRequests: usageData.total_requests,
          successfulRequests: usageData.success_requests,
          failedRequests: usageData.error_requests,
          averageResponseTime: usageData.avg_response_time_ms,
          requestsToday: 0, // TODO: Calculate from usage array
          requestsThisWeek: 0, // TODO: Calculate from usage array
          requestsThisMonth: usageData.total_requests,
        },
        rateLimitInfo: {
          // TODO: Get rate limit info from API
          limit: 1000,
          remaining: 847,
          resetAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          tier: 'pro',
        },
        timeSeriesData: [], // TODO: Calculate from usage array
        endpointBreakdown: [], // TODO: Calculate from usage array
        statusCodeBreakdown: {}, // TODO: Calculate from usage array
      }
    : null

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
      <YStack f={1} jc="center" ai="center" padding="$8">
        <Spinner size="large" color="$blue10" />
        <Paragraph mt="$4" color="$gray11">
          Loading usage analytics...
        </Paragraph>
      </YStack>
    )
  }

  if (!data) {
    return (
      <Card padded bordered>
        <YStack ai="center" gap="$4" padding="$6">
          <AlertCircle size={48} color="$gray9" />
          <YStack ai="center" gap="$2">
            <H4>No Data Available</H4>
            <Paragraph color="$gray11" textAlign="center">
              Unable to load usage analytics for this API key
            </Paragraph>
          </YStack>
        </YStack>
      </Card>
    )
  }

  return (
    <YStack f={1} gap="$4">
      {/* Header */}
      <XStack jc="space-between" ai="center">
        <YStack gap="$2">
          <H3>API Key Usage Analytics</H3>
          <Paragraph color="$gray11">{data.apiKeyName}</Paragraph>
        </YStack>
        {onClose && (
          <Button variant="outlined" onPress={onClose}>
            Close
          </Button>
        )}
      </XStack>

      <Separator />

      {/* Time Range Selector */}
      <XStack gap="$2">
        {TIME_RANGES.map((range) => (
          <Button
            key={range.value}
            size="$3"
            variant={timeRange === range.value ? 'outlined' : 'outlined'}
            theme={timeRange === range.value ? 'blue' : undefined}
            onPress={() => setTimeRange(range.value)}
          >
            {range.label}
          </Button>
        ))}
      </XStack>

      {/* Key Metrics */}
      <XStack gap="$3" flexWrap="wrap">
        {/* Total Requests */}
        <Card f={1} minWidth={200} padded bordered>
          <YStack gap="$3">
            <XStack jc="space-between" ai="center">
              <Paragraph size="$2" color="$gray11">
                Total Requests
              </Paragraph>
              <Activity size={20} color="$blue10" />
            </XStack>
            <H3>{data.metrics.totalRequests.toLocaleString()}</H3>
            <XStack ai="center" gap="$2">
              <TrendingUp size={16} color="$green10" />
              <Paragraph size="$2" color="$green10">
                +12% from last period
              </Paragraph>
            </XStack>
          </YStack>
        </Card>

        {/* Success Rate */}
        <Card f={1} minWidth={200} padded bordered>
          <YStack gap="$3">
            <XStack jc="space-between" ai="center">
              <Paragraph size="$2" color="$gray11">
                Success Rate
              </Paragraph>
              <CheckCircle size={20} color="$green10" />
            </XStack>
            <H3>{successRate}%</H3>
            <XStack ai="center" gap="$2">
              <Paragraph size="$2" color="$gray11">
                {data.metrics.successfulRequests.toLocaleString()} successful
              </Paragraph>
            </XStack>
          </YStack>
        </Card>

        {/* Avg Response Time */}
        <Card f={1} minWidth={200} padded bordered>
          <YStack gap="$3">
            <XStack jc="space-between" ai="center">
              <Paragraph size="$2" color="$gray11">
                Avg Response Time
              </Paragraph>
              <Clock size={20} color="$orange10" />
            </XStack>
            <H3>{data.metrics.averageResponseTime}ms</H3>
            <XStack ai="center" gap="$2">
              <ArrowDown size={16} color="$green10" />
              <Paragraph size="$2" color="$green10">
                8% faster
              </Paragraph>
            </XStack>
          </YStack>
        </Card>

        {/* Errors */}
        <Card f={1} minWidth={200} padded bordered>
          <YStack gap="$3">
            <XStack jc="space-between" ai="center">
              <Paragraph size="$2" color="$gray11">
                Failed Requests
              </Paragraph>
              <XCircle size={20} color="$red10" />
            </XStack>
            <H3>{data.metrics.failedRequests}</H3>
            <XStack ai="center" gap="$2">
              <Paragraph size="$2" color="$gray11">
                {((data.metrics.failedRequests / data.metrics.totalRequests) * 100).toFixed(2)}%
                error rate
              </Paragraph>
            </XStack>
          </YStack>
        </Card>
      </XStack>

      {/* Rate Limit Status */}
      <Card bordered padding="$4" backgroundColor="$blue2">
        <YStack gap="$3">
          <XStack jc="space-between" ai="center">
            <H4>Rate Limit Status</H4>
            <Card
              backgroundColor={getRateLimitColor()}
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius="$3"
            >
              <Paragraph size="$3" color="$gray12" fontWeight="600">
                {data.rateLimitInfo.tier.toUpperCase()}
              </Paragraph>
            </Card>
          </XStack>

          <XStack ai="center" gap="$4">
            <YStack f={1} gap="$2">
              <XStack jc="space-between">
                <Paragraph size="$2" color="$gray11">
                  Remaining
                </Paragraph>
                <Paragraph size="$2" fontWeight="600">
                  {data.rateLimitInfo.remaining} / {data.rateLimitInfo.limit}
                </Paragraph>
              </XStack>

              {/* Progress Bar */}
              <Card height={8} backgroundColor="$gray4" borderRadius="$10" overflow="hidden">
                <Card
                  height="100%"
                  width={`${getRateLimitPercentage()}%`}
                  backgroundColor={getRateLimitColor()}
                />
              </Card>

              <Paragraph size="$2" color="$gray11">
                Resets {format(new Date(data.rateLimitInfo.resetAt), 'h:mm a')}
              </Paragraph>
            </YStack>
          </XStack>
        </YStack>
      </Card>

      {/* Requests Timeline (Simple visualization) */}
      <Card bordered padding="$4">
        <YStack gap="$4">
          <XStack jc="space-between" ai="center">
            <H4>Request Volume</H4>
            <BarChart3 size={20} color="$blue10" />
          </XStack>

          {/* Simple bar chart */}
          <YStack gap="$2">
            {data.timeSeriesData.slice(-7).map((day, index) => {
              const maxRequests = Math.max(...data.timeSeriesData.map((d) => d.requests))
              const percentage = (day.requests / maxRequests) * 100

              return (
                <YStack key={index} gap="$1">
                  <XStack jc="space-between" ai="center">
                    <Paragraph size="$2" color="$gray11" minWidth={60}>
                      {day.date}
                    </Paragraph>
                    <Card
                      f={1}
                      height={24}
                      backgroundColor="$gray3"
                      borderRadius="$2"
                      overflow="hidden"
                      mx="$2"
                    >
                      <Card height="100%" width={`${percentage}%`} backgroundColor="$blue8" />
                    </Card>
                    <Paragraph size="$2" fontWeight="600" minWidth={50} textAlign="right">
                      {day.requests}
                    </Paragraph>
                  </XStack>
                </YStack>
              )
            })}
          </YStack>
        </YStack>
      </Card>

      {/* Endpoint Breakdown */}
      <Card bordered padding="$4">
        <YStack gap="$4">
          <H4>Top Endpoints</H4>

          <YStack gap="$2">
            {data.endpointBreakdown.map((endpoint, index) => (
              <Card key={index} backgroundColor="$gray2" padding="$3" borderRadius="$3">
                <YStack gap="$2">
                  <XStack jc="space-between" ai="center">
                    <YStack f={1}>
                      <XStack ai="center" gap="$2">
                        <Card
                          backgroundColor={
                            endpoint.method === 'GET'
                              ? '$blue3'
                              : endpoint.method === 'POST'
                                ? '$green3'
                                : '$orange3'
                          }
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          <Paragraph
                            size="$1"
                            fontWeight="600"
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
                        <Paragraph fontFamily="$mono" size="$3">
                          {endpoint.endpoint}
                        </Paragraph>
                      </XStack>
                    </YStack>
                    <Paragraph fontWeight="600">{endpoint.count.toLocaleString()}</Paragraph>
                  </XStack>

                  <XStack gap="$4">
                    <Paragraph size="$2" color="$gray11">
                      Avg: {endpoint.avgResponseTime}ms
                    </Paragraph>
                    <Paragraph size="$2" color={endpoint.errorRate > 1 ? '$red11' : '$gray11'}>
                      Error: {endpoint.errorRate}%
                    </Paragraph>
                  </XStack>
                </YStack>
              </Card>
            ))}
          </YStack>
        </YStack>
      </Card>

      {/* Status Code Breakdown */}
      <Card bordered padding="$4">
        <YStack gap="$4">
          <H4>Status Codes</H4>

          <XStack gap="$2" flexWrap="wrap">
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
                  padding="$3"
                  borderRadius="$3"
                  minWidth={100}
                >
                  <YStack gap="$1" ai="center">
                    <Paragraph
                      size="$2"
                      fontWeight="600"
                      color={isSuccess ? '$green11' : isClientError ? '$orange11' : '$red11'}
                    >
                      {code}
                    </Paragraph>
                    <Paragraph fontWeight="600">{count.toLocaleString()}</Paragraph>
                  </YStack>
                </Card>
              )
            })}
          </XStack>
        </YStack>
      </Card>
    </YStack>
  )
}
