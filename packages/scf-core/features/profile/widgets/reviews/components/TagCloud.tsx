import { Text, Row, Stack } from '@scaffald/ui'
import type { TagData } from '../types'

interface TagCloudProps {
  title: string
  tags: TagData[]
  variant: 'strength' | 'improvement'
  maxTags?: number
}

/**
 * TagCloud component displays skill tags with frequency-based sizing
 * Used for showing strengths and areas for improvement from reviews
 */
export function TagCloud({ title, tags, variant, maxTags = 20 }: TagCloudProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  const displayTags = tags.slice(0, maxTags)
  const maxCount = Math.max(...displayTags.map((t) => t.count))
  const minCount = Math.min(...displayTags.map((t) => t.count))

  // Calculate relative size (1-3 scale)
  const getRelativeSize = (count: number) => {
    if (maxCount === minCount) return 2
    const normalized = (count - minCount) / (maxCount - minCount)
    return 1 + normalized * 2 // Range: 1-3
  }

  const bgColor = variant === 'strength' ? '$green3' : '$red3'
  const textColor = variant === 'strength' ? '$green11' : '$red11'

  return (
    <Stack gap={12}>
      <Text color="$gray11">{title}</Text>
      <Row gap={8} flexWrap="wrap">
        {displayTags.map((tag) => {
          const relativeSize = getRelativeSize(tag.count)
          const _fontSize = relativeSize <= 1.5 ? '$2' : relativeSize <= 2.5 ? '$3' : '$4'

          return (
            <Row
              key={tag.name}
              backgroundColor={bgColor}
              paddingHorizontal={12}
              paddingVertical={6}
              borderRadius={12}
            >
              <Text color={textColor}>
                {tag.name} ({tag.count})
              </Text>
            </Row>
          )
        })}
      </Row>
    </Stack>
  )
}
