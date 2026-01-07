/**
 * CheckIcon - Checkmark icon for checked state
 */

import Svg, { Path } from 'react-native-svg'

interface CheckIconProps {
  size?: number
  color?: string
}

export function CheckIcon({ size = 12, color = '#FFFFFF' }: CheckIconProps) {
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
