/**
 * SkeletonLoader - Loading skeleton component using Tamagui
 */
import React from 'react';
import { YStack, XStack, styled } from '@unicornlove/ui';

// Use Tamagui's animation prop instead of CSS animationDuration
// Tamagui will handle the animation properly without passing it to DOM
const SkeletonBox = styled(YStack, {
  name: 'SkeletonBox',
  backgroundColor: '$color4',
  borderRadius: '$md',
  animation: 'pulse',
  // Remove animationDuration - use Tamagui's animation system instead
  // animationDuration is handled by the 'pulse' animation config
});

interface SkeletonLoaderProps {
  variant?: 'card' | 'table' | 'chart' | 'text';
  count?: number;
}

export default function SkeletonLoader({
  variant = 'card',
  count = 1,
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <YStack
            backgroundColor="$backgroundHover"
            borderRadius="$md"
            shadowColor="$shadowColor"
            shadowRadius={4}
            shadowOffset={{ width: 0, height: 2 }}
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
          >
            <SkeletonBox height={24} width="33%" marginBottom="$4" />
            <SkeletonBox height={16} width="66%" marginBottom="$2" />
            <SkeletonBox height={16} width="50%" />
          </YStack>
        );

      case 'table':
        return (
          <YStack
            backgroundColor="$backgroundHover"
            borderRadius="$md"
            shadowColor="$shadowColor"
            shadowRadius={4}
            shadowOffset={{ width: 0, height: 2 }}
            borderWidth={1}
            borderColor="$borderColor"
            overflow="hidden"
          >
            <YStack padding="$6" borderBottomWidth={1} borderBottomColor="$borderColor" gap="$2">
              <SkeletonBox height={24} width="25%" />
              <SkeletonBox height={16} width="33%" />
            </YStack>
            <YStack>
              {[...Array(5)].map((_, i) => (
                <XStack
                  key={i}
                  padding="$6"
                  alignItems="center"
                  gap="$4"
                  borderBottomWidth={i < 4 ? 1 : 0}
                  borderBottomColor="$borderColor"
                >
                  <SkeletonBox width={48} height={48} borderRadius="$10" />
                  <YStack flex={1} gap="$2">
                    <SkeletonBox height={16} width="25%" />
                    <SkeletonBox height={12} width="33%" />
                  </YStack>
                  <SkeletonBox height={32} width={80} />
                </XStack>
              ))}
            </YStack>
          </YStack>
        );

      case 'chart':
        return (
          <YStack
            backgroundColor="$backgroundHover"
            borderRadius="$md"
            shadowColor="$shadowColor"
            shadowRadius={4}
            shadowOffset={{ width: 0, height: 2 }}
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
            gap="$6"
          >
            <SkeletonBox height={24} width="33%" />
            <YStack gap="$4">
              {[...Array(6)].map((_, i) => (
                <XStack key={i} alignItems="center" gap="$3">
                  <SkeletonBox height={16} width={64} />
                  <SkeletonBox
                    flex={1}
                    height={32}
                    width={`${Math.random() * 60 + 40}%`}
                  />
                  <SkeletonBox height={16} width={64} />
                </XStack>
              ))}
            </YStack>
          </YStack>
        );

      case 'text':
        return (
          <YStack gap="$2">
            <SkeletonBox height={16} width="100%" />
            <SkeletonBox height={16} width="83%" />
            <SkeletonBox height={16} width="66%" />
          </YStack>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <YStack key={index} marginBottom={count > 1 ? '$4' : 0}>
          {renderSkeleton()}
        </YStack>
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <YStack gap="$6">
      <YStack gap="$2">
        <SkeletonBox height={32} width="25%" />
        <SkeletonBox height={16} width="33%" />
      </YStack>

      <XStack
        flexDirection="row"
        flexWrap="wrap"
        gap="$6"
      >
        {[...Array(4)].map((_, i) => (
          <YStack
            key={i}
            flex={1}
            minWidth={200}
            backgroundColor="$backgroundHover"
            borderRadius="$md"
            shadowColor="$shadowColor"
            shadowRadius={4}
            shadowOffset={{ width: 0, height: 2 }}
            borderWidth={1}
            borderColor="$borderColor"
            padding="$6"
            gap="$4"
          >
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
              <SkeletonBox width={48} height={48} borderRadius="$md" />
              <SkeletonBox height={32} width={64} />
            </XStack>
            <SkeletonBox height={16} width="66%" marginBottom="$2" />
            <SkeletonBox height={12} width="50%" />
          </YStack>
        ))}
      </XStack>

      <SkeletonLoader variant="chart" />
      <SkeletonLoader variant="table" />
    </YStack>
  );
}
