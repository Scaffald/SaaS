import React from 'react';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';

export type ProgressVariant = 'primary' | 'success' | 'warning' | 'error';
export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

const ProgressContainer = styled(YStack, {
  name: 'ProgressContainer',
});

const ProgressBar = styled(XStack, {
  name: 'ProgressBar',
  width: '100%',
  backgroundColor: '$gray4',
  borderRadius: '$full',
  overflow: 'hidden',
  variants: {
    size: {
      sm: { height: 4 }, // h-1
      md: { height: 8 }, // h-2
      lg: { height: 12 }, // h-3
    },
  } as const,
});

const ProgressFill = styled(XStack, {
  name: 'ProgressFill',
  borderRadius: '$full',
  transition: 'all 0.3s ease-out',
  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary9',
      },
      success: {
        backgroundColor: '$green9',
      },
      warning: {
        backgroundColor: '$orange9',
      },
      error: {
        backgroundColor: '$red9',
      },
    },
    size: {
      sm: { height: 4 },
      md: { height: 8 },
      lg: { height: 12 },
    },
  } as const,
});

export default function Progress({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  className = '',
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <ProgressContainer className={className}>
      {(showLabel || label) && (
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
          <Text fontSize="$2" fontWeight="500" color="$color11">
            {label || `${Math.round(percentage)}%`}
          </Text>
          {label && showLabel && (
            <Text fontSize="$2" color="$color10">
              {Math.round(percentage)}%
            </Text>
          )}
        </XStack>
      )}
      <ProgressBar size={size}>
        <ProgressFill
          variant={variant}
          size={size}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </ProgressBar>
    </ProgressContainer>
  );
}

export function CircularProgress({
  value,
  max = 100,
  variant = 'primary',
  size = 64,
  strokeWidth = 4,
  showLabel = true,
  className = '',
}: Omit<ProgressProps, 'size'> & { size?: number; strokeWidth?: number }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    primary: '$primary9',
    success: '$green9',
    warning: '$orange9',
    error: '$red9',
  };

  return (
    <XStack
      position="relative"
      alignItems="center"
      justifyContent="center"
      className={className}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
        />
      </svg>
      {showLabel && (
        <Text
          position="absolute"
          fontSize="$3"
          fontWeight="600"
          color={variantColors[variant]}
        >
          {Math.round(percentage)}%
        </Text>
      )}
    </XStack>
  );
}
