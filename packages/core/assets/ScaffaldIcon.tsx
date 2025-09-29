import React from 'react'
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg'

export interface ScaffaldIconProps {
  size?: number
  primaryColor?: string
  secondaryColor?: string
  gradientStart?: string
  gradientEnd?: string
  className?: string
  style?: any
}

/**
 * ScaffaldIcon - Icon-only version of the Scaffald logo (just the scaffold symbol)
 *
 * Features:
 * - Square aspect ratio (1:1)
 * - Customizable colors and gradients
 * - Animation-ready props
 * - Cross-platform compatibility
 *
 * @param size - Icon size (default: 48)
 * @param primaryColor - Primary brand color (default: #034550)
 * @param secondaryColor - Secondary brand color (default: #2A7F8E)
 * @param gradientStart - Gradient start color (default: #76EAFF)
 * @param gradientEnd - Gradient end color (default: #239CB2)
 * @param className - CSS class name for web
 * @param style - Additional styles
 */
export const ScaffaldIcon = ({
  size = 48,
  primaryColor = '#034550',
  secondaryColor = '#2A7F8E',
  gradientStart = '#76EAFF',
  gradientEnd = '#239CB2',
  className,
  style,
}: ScaffaldIconProps) => {
  const viewBox = '0 0 102 99'

  return (
    <Svg width={size} height={size} viewBox={viewBox} className={className} style={style}>
      <Defs>
        <LinearGradient
          id="paint0_linear_scaffold_icon"
          x1="51"
          y1="0"
          x2="51"
          y2="89"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor={gradientStart} />
          <Stop offset="1" stopColor={gradientEnd} />
        </LinearGradient>
      </Defs>

      {/* Scaffold Icon - Bottom Left */}
      <Path d="M11 99L0 89H46V99H11Z" fill={secondaryColor} />

      {/* Scaffold Icon - Bottom Right */}
      <Path d="M90.9999 99L102 89H55.9999V99H90.9999Z" fill={secondaryColor} />

      {/* Main Scaffold Icon */}
      <Path
        d="M32 0L0 89H46V65H39L51 34.5L63 65H56V89H102L70 0H32Z"
        fill="url(#paint0_linear_scaffold_icon)"
      />
    </Svg>
  )
}

export default ScaffaldIcon
