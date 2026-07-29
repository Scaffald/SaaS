import Svg, { Circle, Path, Polyline } from 'react-native-svg'

/**
 * Line icons for the "how it works" cards, ported from the original marketing
 * site's inline SVGs. Emoji were tried first and read as off-brand — they pick
 * up the host OS's colour palette, which clashes with the muted teal system.
 */

type IconProps = { color: string; size?: number }

const strokeProps = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
}

export function ProfileIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" color={color}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...strokeProps} />
      <Circle cx="12" cy="7" r="4" {...strokeProps} />
    </Svg>
  )
}

export function SearchIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" color={color}>
      <Circle cx="11" cy="11" r="8" {...strokeProps} />
      <Path d="m21 21-4.35-4.35" {...strokeProps} />
    </Svg>
  )
}

export function ReviewIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" color={color}>
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...strokeProps} />
    </Svg>
  )
}

export function VerifiedIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" color={color}>
      <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" {...strokeProps} />
      <Polyline points="22 4 12 14.01 9 11.01" {...strokeProps} />
    </Svg>
  )
}

export function ArrowRightIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" color={color}>
      <Path d="M3 8h10M9 4l4 4-4 4" {...strokeProps} />
    </Svg>
  )
}

export function PlusMinusIcon({ color, open, size = 20 }: IconProps & { open: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" color={color}>
      {open ? null : <Path d="M10 4v12" {...strokeProps} />}
      <Path d="M4 10h12" {...strokeProps} />
    </Svg>
  )
}
