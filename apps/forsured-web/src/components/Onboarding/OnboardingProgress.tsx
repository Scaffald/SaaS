/**
 * OnboardingProgress - Progress indicator using Beyond UI
 */
import React from 'react';
import { Stack, Text } from '@scaffald/ui';

interface OnboardingProgressProps {
  current: number;
  total: number;
}

function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  const progress = (current / total) * 100;

  return (
    <Stack style={{ gap: 8, marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
        }}
      >
        Step {current} of {total}
      </Text>
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--color-gray-4)',
          borderRadius: 10,
          height: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 10,
            backgroundColor: 'var(--color-blue-9)',
            borderRadius: 10,
            transition: 'width 300ms',
            width: `${progress}%`,
          }}
        />
      </div>
    </Stack>
  );
}

export default OnboardingProgress;
