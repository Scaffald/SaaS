import { YStack, Skeleton } from '@app/ui'

// Simple skeleton component for content loading state
export const TwoColumnContentSkeleton = () => (
  <YStack gap="$4" p="$4">
    <Skeleton height={60} width="100%" />
    <Skeleton height={200} width="100%" />
    <Skeleton height={150} width="100%" />
  </YStack>
)
