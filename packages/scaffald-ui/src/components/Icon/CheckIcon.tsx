/**
 * CheckIcon component
 * Checkmark icon for success/checked states
 * Shared implementation using react-native-svg
 *
 * @example
 * ```tsx
 * import { CheckIcon } from '@scaffald/ui'
 *
 * <CheckIcon size={16} color="#FFFFFF" />
 * ```
 */

import Svg, { Path } from 'react-native-svg'

export interface CheckIconProps {
  /**
   * Icon size in pixels
   * @default 16
   */
  size?: number

  /**
   * Icon color
   * @default '#FFFFFF' (white)
   */
  color?: string
}

/**
 * Checkmark icon
 * Simple checkmark path for success and checked states
 */
export function CheckIcon({ size = 16, color = '#FFFFFF' }: CheckIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2 6L5 9L10 3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

