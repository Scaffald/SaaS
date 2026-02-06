import type { SizeTokens } from '@tamagui/core'
import { View } from '@tamagui/core'

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
  const borderRadiusValue = borderRadius === '$2' ? 8 : borderRadius
  return (
    <View
      background="$color3"
      overflow="hidden"
      opacity={animated ? 0.6 : 0.5}
      width={width as any}
      height={height as any}
      aria-busy={true}
      aria-label="Loading content"
      style={{ borderRadius: borderRadiusValue as number }}
      {...props}
    />
  )
}
