import { View, styled } from 'tamagui'

export interface SkeletonBoxProps {
  /** Width of the skeleton box */
  width?: number | string
  /** Height of the skeleton box */
  height?: number | string
  /** Whether animation is enabled */
  animated?: boolean
  /** Border radius */
  borderRadius?: number | string
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
  borderRadius,
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
      // @ts-expect-error - rounded prop type mismatch with theme tokens
      rounded={
        typeof borderRadius === 'string' && borderRadius.startsWith('$')
          ? borderRadius
          : typeof borderRadius === 'number'
            ? borderRadius
            : '$2'
      }
      opacity={animated ? 0.6 : 0.5}
      aria-busy="true"
      aria-label="Loading content"
      {...props}
    />
  )
}
