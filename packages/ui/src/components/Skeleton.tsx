import { View, ViewProps } from 'tamagui'

export interface SkeletonProps extends ViewProps {
  height?: number | string
  width?: number | string
  borderRadius?: number | string
}

export const Skeleton = ({
  height = 20,
  width = '100%',
  borderRadius = 4,
  backgroundColor = '$gray6',
  ...props
}: SkeletonProps) => {
  return (
    <View
      height={height}
      width={width}
      borderRadius={borderRadius}
      backgroundColor={backgroundColor}
      animation="bouncy"
      opacity={0.6}
      {...props}
    />
  )
}
