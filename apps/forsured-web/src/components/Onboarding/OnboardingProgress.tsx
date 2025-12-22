/**
 * OnboardingProgress - Progress indicator using Tamagui
 */
import React from 'react';
import { YStack, Text, styled } from '@unicornlove/ui';

interface OnboardingProgressProps {
  current: number;
  total: number;
}

const ProgressBar = styled(YStack, {
  name: 'ProgressBar',
  width: '100%',
  backgroundColor: '$color4',
  borderRadius: '$10',
  height: 10,
  overflow: 'hidden',
});

const ProgressFill = styled(YStack, {
  name: 'ProgressFill',
  height: 10,
  backgroundColor: '$blue9',
  borderRadius: '$10',
  transition: 'width 300ms',
});

function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  const progress = (current / total) * 100;

  return (
    <YStack gap="$2" mb="$6">
      <Text fontSize="$2" fontWeight="500" color="$color11">
        Step {current} of {total}
      </Text>
      <ProgressBar>
        <ProgressFill width={`${progress}%`} />
      </ProgressBar>
    </YStack>
  );
}

export default OnboardingProgress;
