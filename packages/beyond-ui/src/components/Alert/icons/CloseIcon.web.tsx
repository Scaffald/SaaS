/**
 * CloseIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

interface CloseIconProps {
  color: string
  size?: number
}

export function CloseIcon({ color, size = 24 }: CloseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Close">
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
