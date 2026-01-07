/**
 * MinusIcon - Horizontal line icon for indeterminate state
 */

import Svg, { Path } from 'react-native-svg'

interface MinusIconProps {
  size?: number
  color?: string
}

export function MinusIcon({ size = 12, color = '#FFFFFF' }: MinusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M3 6H9" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}
