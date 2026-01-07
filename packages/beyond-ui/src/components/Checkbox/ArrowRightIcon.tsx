/**
 * ArrowRightIcon - Right-pointing arrow for collapsed tree nodes
 */

import Svg, { Path } from 'react-native-svg'

interface ArrowRightIconProps {
  size?: number
  color?: string
}

export function ArrowRightIcon({ size = 16, color = '#141c25' }: ArrowRightIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 12L10 8L6 4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
