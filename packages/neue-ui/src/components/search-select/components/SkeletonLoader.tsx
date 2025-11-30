import { YStack } from 'tamagui'
import { SkeletonText } from '../../skeletons/SkeletonText'

interface SkeletonLoaderProps {
  rows?: number
}

export const ResultsSkeletonLoader = ({ rows = 3 }: SkeletonLoaderProps) => {
  const skeletonIds = Array.from({ length: rows }, (_, index) => `result-skeleton-${index}`)
  return (
    <YStack gap="$3" p="$4" aria-busy={true}>
      {skeletonIds.map((id) => (
        <SkeletonText key={id} lines={2} width="90%" lineHeight={12} />
      ))}
    </YStack>
  )
}
