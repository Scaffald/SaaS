/**
 * ArrowDownIcon - Down-pointing arrow for expanded tree nodes
 */

import Svg, { Path } from 'react-native-svg'

interface ArrowDownIconProps {
  size?: number
  color?: string
}

export function ArrowDownIcon({ size = 16, color = '#141c25' }: ArrowDownIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4 6L8 10L12 6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
