import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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

  const bgColor = variant === 'strength' ? (t === 'light' ? colors.success[100] : colors.success[900]) : (t === 'light' ? colors.error[100] : colors.error[900])
  const textColor = variant === 'strength' ? colors.success[500] : colors.error[500]

  return (
    <Stack gap={12}>
      <Text style={{ color: colors.text[t].secondary }}>{title}</Text>
      <Row gap={8} wrap>
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
              <Text style={{ color: textColor }}>
                {tag.name} ({tag.count})
              </Text>
            </Row>
          )
        })}
      </Row>
    </Stack>
  )
}
