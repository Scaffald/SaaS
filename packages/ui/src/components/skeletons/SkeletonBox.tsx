import type { SizeTokens } from 'tamagui'
import { styled, View } from 'tamagui'

export interface SkeletonBoxProps {
  /** Width of the skeleton box */
  width?: number | string
  /** Height of the skeleton box */
  height?: number | string
  /** Whether animation is enabled */
  animated?: boolean
  /** Border radius (Tamagui uses rounded prop) */
  borderRadius?: SizeTokens
}

export const SkeletonBox = ({
  width,
  height,
  animated = true,
  borderRadius = '$2',
  ...props
}: SkeletonBoxProps) => {
  return (
    <View
      background="$color3"
      borderRadius={borderRadius}
      overflow="hidden"
      opacity={animated ? 0.6 : 0.5}
      width={width}
      height={height}
      aria-busy={true}
      aria-label="Loading content"
      {...props}
    />
  )
}
