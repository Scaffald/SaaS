/**
 * ErrorIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

interface ErrorIconProps {
  color: string
  size?: number
}

export function ErrorIcon({ color, size = 24 }: ErrorIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Error">
      <circle cx="12" cy="12" r="10" fill={color} />
      <path
        d="M15 9L9 15M9 9L15 15"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
