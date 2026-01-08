/**
 * InfoIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

interface InfoIconProps {
  color: string
  size?: number
}

export function InfoIcon({ color, size = 24 }: InfoIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Info">
      <circle cx="12" cy="12" r="10" fill={color} />
      <path
        d="M12 16V12M12 8H12.01"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
