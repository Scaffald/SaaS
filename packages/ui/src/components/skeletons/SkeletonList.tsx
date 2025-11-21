import { YStack } from 'tamagui'
import { SkeletonCard } from './SkeletonCard'

export interface SkeletonListProps {
  /** Number of skeleton items to render */
  count?: number
  /** Gap between items */
  gap?: Parameters<typeof YStack>[0]['gap']
  /** Variant of skeleton cards */
  variant?: 'job' | 'profile' | 'organization'
}

export function SkeletonList({ count = 5, gap = '$3', variant = 'job' }: SkeletonListProps) {
  return (
    <YStack gap={gap} aria-busy={true} aria-label="Loading content list">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={`skeleton-list-item-${index}-${count}`} variant={variant} />
      ))}
    </YStack>
  )
}
