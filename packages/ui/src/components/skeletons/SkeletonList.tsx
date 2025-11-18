import { YStack } from 'tamagui'
import { SkeletonCard } from './SkeletonCard'

export interface SkeletonListProps {
  /** Number of skeleton items to render */
  count?: number
  /** Gap between items */
  gap?: number | string
  /** Variant of skeleton cards */
  variant?: 'job' | 'profile' | 'organization'
}

export function SkeletonList({ count = 5, gap = '$3', variant = 'job' }: SkeletonListProps) {
  const gapValue = typeof gap === 'string' ? (gap.startsWith('$') ? gap : undefined) : gap
  return (
    // @ts-expect-error - gap prop type mismatch with theme tokens
    <YStack gap={gapValue} aria-busy="true" aria-label="Loading content list">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={`skeleton-list-item-${index}-${count}`} variant={variant} />
      ))}
    </YStack>
  )
}
