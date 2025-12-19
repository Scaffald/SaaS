/**
 * MetricCard - Metric card component using Tamagui
 * REQ-129: Manager Dashboard - Reusable Metric Card Component
 */
import React from 'react';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';
import { Card } from '@unicornlove/ui';
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

const MetricCardContainer = styled(Card, {
  name: 'MetricCard',
  padding: '$6',
  borderWidth: 1,
  
  variants: {
    status: {
      success: {
        borderColor: '$green6',
        backgroundColor: '$green2',
      },
      warning: {
        borderColor: '$yellow6',
        backgroundColor: '$yellow2',
      },
      danger: {
        borderColor: '$red6',
        backgroundColor: '$red2',
      },
      info: {
        borderColor: '$borderColor',
        backgroundColor: '$background',
      },
    },
    clickable: {
      true: {
        cursor: 'pointer',
        hoverStyle: {
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
      },
    },
  } as const,
  
  defaultVariants: {
    status: 'info',
    clickable: false,
  },
});

const SkeletonBox = styled(YStack, {
  name: 'SkeletonBox',
  height: 32,
  backgroundColor: '$color4',
  borderRadius: '$md',
  width: 96,
  animation: 'pulse',
  animationDuration: '2s',
  animationIterationCount: 'infinite',
});

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
    if (!trend) return '$color10';
    switch (trend.direction) {
      case 'up':
        return '$green9';
      case 'down':
        return '$red9';
      default:
        return '$color10';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') {
      return <TrendingUp size={16} color="currentColor" />;
    }
    if (trend.direction === 'down') {
      return <TrendingDown size={16} color="currentColor" />;
    }
    return <Minus size={16} color="currentColor" />;
  };

  return (
    <MetricCardContainer
      status={status}
      clickable={!!onClick}
      onPress={onClick}
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
    >
      <XStack alignItems="flex-start" justifyContent="space-between">
        <YStack flex={1} gap="$1">
          <Text fontSize="$2" fontWeight="500" color="$color10" marginBottom="$1">
            {title}
          </Text>
          {loading ? (
            <SkeletonBox />
          ) : (
            <>
              <Text fontSize="$9" fontWeight="700" color="$color12" marginBottom="$2">
                {value}
              </Text>
              {subtitle && (
                <Text fontSize="$2" color="$color9">
                  {subtitle}
                </Text>
              )}
              {trend && (
                <XStack alignItems="center" gap="$1" marginTop="$2" fontSize="$2" color={getTrendColor()}>
                  {getTrendIcon()}
                  <Text>{Math.abs(trend.value)}%</Text>
                  <Text color="$color9">vs last week</Text>
                </XStack>
              )}
            </>
          )}
        </YStack>
        {icon && (
          <YStack marginLeft="$4" color="$color8">
            {icon}
          </YStack>
        )}
      </XStack>
    </MetricCardContainer>
  );
};
