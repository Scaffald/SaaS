/**
 * MetricCard - Metric card component using Beyond UI MetricWidget
 * Reusable metric card component
 * Now uses MetricWidget from @unicornlove/beyond-ui internally
 */
import React from 'react'
import { Card, Row, Stack } from '@unicornlove/beyond-ui'
import { MetricWidget } from '@unicornlove/beyond-ui'
import type { MetricWidgetType, MetricChangeType } from '@unicornlove/beyond-ui'

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
  icon?: React.ReactNode
  status?: 'success' | 'warning' | 'danger' | 'info'
  loading?: boolean
  onClick?: () => void
  className?: string
}

const getStatusStyles = (status: MetricCardProps['status']) => {
  switch (status) {
    case 'success':
      return {
        borderColor: 'var(--color-green-6)',
        backgroundColor: 'var(--color-green-2)',
      }
    case 'warning':
      return {
        borderColor: 'var(--color-yellow-6)',
        backgroundColor: 'var(--color-yellow-2)',
      }
    case 'danger':
      return {
        borderColor: 'var(--color-red-6)',
        backgroundColor: 'var(--color-red-2)',
      }
    case 'info':
    default:
      return {
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-background)',
      }
  }
}

const mapTrendToChangeType = (direction: 'up' | 'down' | 'neutral'): MetricChangeType => {
  switch (direction) {
    case 'up':
      return 'positive'
    case 'down':
      return 'negative'
    default:
      return 'neutral'
  }
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  status = 'info',
  loading = false,
  onClick,
  className = '',
}) => {
  const statusStyles = getStatusStyles(status)

  // Determine widget type based on whether we have trend data
  const widgetType: MetricWidgetType = trend ? 'Chart 01' : 'Blank 01'

  // Map trend to MetricWidget props
  const change = trend
    ? `${trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}${Math.abs(trend.value)}%`
    : undefined
  const changeType = trend ? mapTrendToChangeType(trend.direction) : undefined

  // If loading, show skeleton
  if (loading) {
    return (
      <Card
        style={{
          padding: 24,
          border: '1px solid',
          ...statusStyles,
        }}
        className={className}
      >
        <Stack
          style={{
            height: 32,
            backgroundColor: 'var(--color-text-muted)',
            borderRadius: 8,
            width: 96,
            opacity: 0.3,
          }}
        />
      </Card>
    )
  }

  return (
    <Card
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      style={{
        padding: 24,
        border: '1px solid',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s ease',
        ...statusStyles,
      }}
      className={className}
    >
      <Row alignItems="flex-start" justifyContent="space-between">
        <Stack flex={1}>
          <MetricWidget
            type={widgetType}
            title={title}
            value={value}
            change={change}
            changeType={changeType}
            subtitle={subtitle}
          />
        </Stack>
        {icon && <Stack style={{ marginLeft: 16, color: 'var(--color-text-muted)' }}>{icon}</Stack>}
      </Row>
    </Card>
  )
}
