/**
 * Icons for Stepper component
 */

import Svg, { Path } from 'react-native-svg'

interface CheckIconProps {
  size?: number
  color?: string
}

/**
 * Checkmark icon for completed steps
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

interface ArrowRightIconProps {
  size?: number
  color?: string
}

/**
 * Right arrow icon for step separators
 */
export function ArrowRightIcon({ size = 20, color = '#637083' }: ArrowRightIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M7.5 5L12.5 10L7.5 15"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

