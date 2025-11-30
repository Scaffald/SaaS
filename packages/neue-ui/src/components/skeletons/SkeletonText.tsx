import { YStack } from 'tamagui'
import { SkeletonBox } from './SkeletonBox'

export interface SkeletonTextProps {
  /** Number of text lines to render */
  lines?: number
  /** Width of the text (can be percentage or fixed value) */
  width?: number | string
  /** Height of each line */
  lineHeight?: number | string
  /** Gap between lines */
  gap?: Parameters<typeof YStack>[0]['gap']
  /** Whether animation is enabled */
  animated?: boolean
}

export const SkeletonText = ({
  lines = 1,
  width = '100%',
  lineHeight = 16,
  gap = '$2',
  animated = true,
}: SkeletonTextProps) => {
  // Generate varying widths for a more natural look (except for single line)
  const getLineWidth = (index: number, totalLines: number) => {
    if (totalLines === 1) return width
    if (index === totalLines - 1) {
      // Last line is shorter (60-80% of width)
      return typeof width === 'string' && width.endsWith('%')
        ? `${Math.floor(Number.parseInt(width.slice(0, -1), 10) * 0.7)}%`
        : width
    }
    return width
  }

  return (
    <YStack gap={gap} aria-busy={true} aria-label="Loading content">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBox
          key={`skeleton-text-line-${index}-${lines}`}
          width={getLineWidth(index, lines)}
          height={lineHeight}
          animated={animated}
          borderRadius="$1"
        />
      ))}
    </YStack>
  )
}
