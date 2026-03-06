import { Stack, Row } from '../Layout'
import { Skeleton, SkeletonAvatar, SkeletonBox, SkeletonText } from '../Skeleton'
import { ChecklistHeader } from './ChecklistHeader'
import { ChecklistProgress } from './ChecklistProgress'
import { ChecklistList } from './ChecklistList'
import { spacing } from '../../tokens/spacing'
import type { ChecklistProps } from './Checklist.types'

export function Checklist({
  title,
  subtitle,
  items,
  completionPercentage,
  onItemPress,
  isLoading = false,
  showProgress = true,
}: ChecklistProps) {
  if (isLoading) {
    return (
      <Stack gap={spacing[4]} style={{ padding: spacing[4] }}>
        <Skeleton width={180} height={20} shape="text" />
        <SkeletonBox width="100%" height={8} borderRadius={99} />
        {[0, 1, 2, 3].map((i) => (
          <Row key={i} gap={12} align="center">
            <SkeletonAvatar size={20} />
            <SkeletonText lines={1} style={{ flex: 1 }} />
          </Row>
        ))}
      </Stack>
    )
  }

  return (
    <Stack gap={spacing[4]} style={{ padding: spacing[4] }}>
      {(title || subtitle) && <ChecklistHeader title={title} subtitle={subtitle} />}
      {showProgress && <ChecklistProgress completionPercentage={completionPercentage} />}
      <ChecklistList items={items} onItemPress={onItemPress} />
    </Stack>
  )
}
