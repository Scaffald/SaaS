import { SkeletonBox } from './SkeletonBox'

export interface SkeletonAvatarProps {
  /** Size variant of the avatar */
  size?: 'small' | 'medium' | 'large'
  /** Whether animation is enabled */
  animated?: boolean
}

const sizeMap = {
  small: 32,
  medium: 48,
  large: 64,
} as const

export const SkeletonAvatar = ({ size = 'medium', animated = true }: SkeletonAvatarProps) => {
  const dimension = sizeMap[size]

  return (
    <SkeletonBox
      width={dimension}
      height={dimension}
      borderRadius="50%"
      animated={animated}
      aria-busy={true}
      aria-label="Loading avatar"
    />
  )
}
