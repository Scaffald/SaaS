/**
 * RelationshipHealthBadge - Relationship health badge using Tamagui
 */
import React from 'react';
import { XStack, Text } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import { TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react';

interface RelationshipHealthBadgeProps {
  health: 'excellent' | 'good' | 'fair' | 'poor';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function RelationshipHealthBadge({
  health,
  showIcon = true,
  size = 'md',
}: RelationshipHealthBadgeProps) {
  const getHealthInfo = () => {
    switch (health) {
      case 'excellent':
        return {
          label: 'Excellent',
          icon: TrendingUp,
          variant: 'success' as const,
        };
      case 'good':
        return {
          label: 'Good',
          icon: CheckCircle,
          variant: 'success' as const,
        };
      case 'fair':
        return {
          label: 'Fair',
          icon: Minus,
          variant: 'warning' as const,
        };
      case 'poor':
        return {
          label: 'Poor',
          icon: TrendingDown,
          variant: 'error' as const,
        };
    }
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const { label, icon: Icon, variant } = getHealthInfo();

  return (
    <Badge variant={variant} size={size}>
      <XStack alignItems="center" gap="$1">
        {showIcon && <Icon size={iconSizes[size]} />}
        <Text>{label}</Text>
      </XStack>
    </Badge>
  );
}
