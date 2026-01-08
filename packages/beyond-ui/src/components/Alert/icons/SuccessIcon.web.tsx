/**
 * SuccessIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

interface SuccessIconProps {
  color: string
  size?: number
}

export function SuccessIcon({ color, size = 24 }: SuccessIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Success">
      <circle cx="12" cy="12" r="10" fill={color} />
      <path
        d="M9 12L11 14L15 10"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
