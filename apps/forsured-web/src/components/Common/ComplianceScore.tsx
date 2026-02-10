/**
 * ComplianceScore - Compliance score display using Beyond UI

 */
import React from 'react'
import { Row, Stack, Text } from '@unicornlove/beyond-ui'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface ComplianceScoreProps {
  score: number
  trend?: 'up' | 'down' | 'stable'
  size?: 'sm' | 'md' | 'lg'
  showTrend?: boolean
}

const sizeStyles = {
  sm: { width: 48, height: 48, fontSize: 16 },
  md: { width: 64, height: 64, fontSize: 20 },
  lg: { width: 80, height: 80, fontSize: 24 },
}

const scoreColors = {
  high: { background: 'var(--color-green-3)', text: 'var(--color-green-11)' },
  medium: { background: 'var(--color-yellow-3)', text: 'var(--color-yellow-11)' },
  low: { background: 'var(--color-orange-3)', text: 'var(--color-orange-11)' },
}

export default function ComplianceScore({
  score,
  trend,
  size = 'md',
  showTrend = true,
}: ComplianceScoreProps) {
  const getScoreVariant = (): 'high' | 'medium' | 'low' => {
    if (score >= 90) return 'high'
    if (score >= 70) return 'medium'
    return 'low'
  }

  const trendIconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  }

  const variant = getScoreVariant()
  const { width, height, fontSize } = sizeStyles[size]
  const colors = scoreColors[variant]

  return (
    <Row alignItems="center" gap={12}>
      <Stack
        alignItems="center"
        justifyContent="center"
        style={{
          width,
          height,
          borderRadius: '50%',
          backgroundColor: colors.background,
        }}
      >
        <Text
          weight="bold"
          style={{
            fontSize,
            color: colors.text,
          }}
        >
          {score}
        </Text>
      </Stack>
      {showTrend && trend && trend !== 'stable' && (
        <Row
          alignItems="center"
          style={{
            color: trend === 'up' ? 'var(--color-green-9)' : 'var(--color-orange-9)',
          }}
        >
          {trend === 'up' ? (
            <TrendingUp size={trendIconSize[size]} />
          ) : (
            <TrendingDown size={trendIconSize[size]} />
          )}
        </Row>
      )}
    </Row>
  )
}
