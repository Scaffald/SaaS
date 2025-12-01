import { XStack, YStack } from 'tamagui'
import { borderRadius } from '../../config/radii'
import { spacing } from '../../config/spacing'
import { SkeletonAvatar } from './SkeletonAvatar'
import { SkeletonBox } from './SkeletonBox'
import { SkeletonText } from './SkeletonText'

export interface SkeletonCardProps {
  /** Variant of the skeleton card */
  variant?: 'job' | 'profile' | 'organization'
}

export function SkeletonCard({ variant: _variant = 'job' }: SkeletonCardProps) {
  return (
    <YStack
      gap={spacing.md}
      padding={spacing.lg}
      backgroundColor="$background"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius={borderRadius['3xl']}
    >
      {/* Header with avatar and title */}
      <XStack gap={spacing.md} alignItems="center">
        <SkeletonAvatar size="medium" />
        <YStack flex={1} gap={spacing.sm}>
          <SkeletonText width="70%" />
          <SkeletonText width="50%" />
        </YStack>
      </XStack>

      {/* Description */}
      <SkeletonText lines={2} />

      {/* Metadata */}
      <XStack gap={spacing.md}>
        <SkeletonBox width={80} height={20} />
        <SkeletonBox width={80} height={20} />
      </XStack>

      {/* Action button */}
      <SkeletonBox width="100%" height={40} />
    </YStack>
  )
}
