import { YStack } from 'tamagui'
import { Skeleton } from '../Skeleton'

// Simple skeleton component for sidebar loading state
export const TwoColumnSidebarSkeleton = () => (
  <YStack gap="$3" p="$4">
    <Skeleton height={40} width="100%" />
    <Skeleton height={20} width="80%" />
    <Skeleton height={20} width="90%" />
    <Skeleton height={20} width="70%" />
  </YStack>
)
