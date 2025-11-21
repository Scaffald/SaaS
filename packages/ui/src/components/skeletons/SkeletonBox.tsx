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

const SkeletonBoxBase = styled(View, {
  background: '$color3',
  rounded: '$2',
  overflow: 'hidden',
  opacity: 0.6,
})

export const SkeletonBox = ({
  width,
  height,
  animated = true,
  borderRadius = '$2',
  ...props
}: SkeletonBoxProps) => {
  return (
    <SkeletonBoxBase
      width={typeof width === 'string' ? undefined : width}
      height={typeof height === 'string' ? undefined : height}
      style={{
        ...(typeof width === 'string' ? { width } : {}),
        ...(typeof height === 'string' ? { height } : {}),
      }}
      rounded={borderRadius as any}
      opacity={animated ? 0.6 : 0.5}
      aria-busy={true}
      aria-label="Loading content"
      {...props}
    />
  )
}
