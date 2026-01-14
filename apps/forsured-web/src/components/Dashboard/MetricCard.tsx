/**
 * MetricCard - Metric card component using Beyond UI
 * REQ-129: Manager Dashboard - Reusable Metric Card Component
 * Migrated from Tamagui to Beyond UI
 */
import React from 'react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

const getStatusStyles = (status: MetricCardProps['status']) => {
  switch (status) {
    case 'success':
      return {
        borderColor: 'var(--color-green-6)',
        backgroundColor: 'var(--color-green-2)',
      };
    case 'warning':
      return {
        borderColor: 'var(--color-yellow-6)',
        backgroundColor: 'var(--color-yellow-2)',
      };
    case 'danger':
      return {
        borderColor: 'var(--color-red-6)',
        backgroundColor: 'var(--color-red-2)',
      };
    case 'info':
    default:
      return {
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-background)',
      };
  }
};

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
  const getTrendColor = () => {
    if (!trend) return 'var(--color-text-muted)';
    switch (trend.direction) {
      case 'up':
        return 'var(--color-green-9)';
      case 'down':
        return 'var(--color-red-9)';
      default:
        return 'var(--color-text-muted)';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') {
      return <TrendingUp size={16} />;
    }
    if (trend.direction === 'down') {
      return <TrendingDown size={16} />;
    }
    return <Minus size={16} />;
  };

  const statusStyles = getStatusStyles(status);

  return (
    <Card
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
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
        <Stack flex={1} gap={4}>
          <Text
            size="sm"
            weight="medium"
            muted
            style={{ marginBottom: 4 }}
          >
            {title}
          </Text>
          {loading ? (
            <Stack
              style={{
                height: 32,
                backgroundColor: 'var(--color-text-muted)',
                borderRadius: 8,
                width: 96,
                opacity: 0.3,
              }}
            />
          ) : (
            <>
              <Text
                size="2xl"
                weight="bold"
                style={{ marginBottom: 8 }}
              >
                {value}
              </Text>
              {subtitle && (
                <Text size="sm" muted>
                  {subtitle}
                </Text>
              )}
              {trend && (
                <Row
                  alignItems="center"
                  gap={4}
                  style={{
                    marginTop: 8,
                    color: getTrendColor(),
                  }}
                >
                  {getTrendIcon()}
                  <Text size="sm">{Math.abs(trend.value)}%</Text>
                  <Text size="sm" muted>
                    vs last week
                  </Text>
                </Row>
              )}
            </>
          )}
        </Stack>
        {icon && (
          <Stack style={{ marginLeft: 16, color: 'var(--color-text-muted)' }}>
            {icon}
          </Stack>
        )}
      </Row>
    </Card>
  );
};
