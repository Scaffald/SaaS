/**
 * ComplianceScore - Compliance score display using Tamagui
 */
import React from 'react';
import { XStack, YStack, Text, styled } from '@unicornlove/ui';
import { TrendingUp, TrendingDown } from 'lucide-react';

const ScoreCircle = styled(YStack, {
  name: 'ScoreCircle',
  borderRadius: '$10',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '700',
  
  variants: {
    size: {
      sm: { width: 48, height: 48, fontSize: '$5' },
      md: { width: 64, height: 64, fontSize: '$8' },
      lg: { width: 80, height: 80, fontSize: '$10' },
    },
    score: {
      high: { backgroundColor: '$green3', color: '$green11' },
      medium: { backgroundColor: '$yellow3', color: '$yellow11' },
      low: { backgroundColor: '$orange3', color: '$orange11' },
    },
  } as const,
  
  defaultVariants: {
    size: 'md',
    score: 'high',
  },
});

interface ComplianceScoreProps {
  score: number;
  trend?: 'up' | 'down' | 'stable';
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
}

export default function ComplianceScore({
  score,
  trend,
  size = 'md',
  showTrend = true,
}: ComplianceScoreProps) {
  const getScoreVariant = (): 'high' | 'medium' | 'low' => {
    if (score >= 90) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  };

  const trendIconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <XStack alignItems="center" gap="$3">
      <ScoreCircle size={size} score={getScoreVariant()}>
        <Text>{score}</Text>
      </ScoreCircle>
      {showTrend && trend && trend !== 'stable' && (
        <XStack
          alignItems="center"
          color={trend === 'up' ? '$green9' : '$orange9'}
        >
          {trend === 'up' ? (
            <TrendingUp size={trendIconSize[size]} />
          ) : (
            <TrendingDown size={trendIconSize[size]} />
          )}
        </XStack>
      )}
    </XStack>
  );
}
