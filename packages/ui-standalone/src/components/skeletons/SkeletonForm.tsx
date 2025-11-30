import { YStack } from 'tamagui'
import { spacing } from '../../config/spacing'
import { SkeletonBox } from './SkeletonBox'
import { SkeletonText } from './SkeletonText'

export interface SkeletonFormProps {
  /** Number of form fields to render */
  fields?: number
  /** Gap between fields */
  gap?: Parameters<typeof YStack>[0]['gap']
}

export function SkeletonForm({ fields = 5, gap = spacing.md }: SkeletonFormProps) {
  return (
    <YStack gap={gap} aria-busy={true} aria-label="Loading form">
      {Array.from({ length: fields }).map((_, index) => (
        <YStack key={`skeleton-form-field-${index}-${fields}`} gap={spacing.sm}>
          {/* Label */}
          <SkeletonText width="30%" lineHeight={14} />
          {/* Input field */}
          <SkeletonBox width="100%" height={40} borderRadius="$2" />
        </YStack>
      ))}
    </YStack>
  )
}
