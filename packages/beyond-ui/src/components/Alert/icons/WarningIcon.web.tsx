/**
 * WarningIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

interface WarningIconProps {
  color: string
  size?: number
}

export function WarningIcon({ color, size = 24 }: WarningIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Warning">
      <path
        d="M12 2L2 20H22L12 2Z"
        fill={color}
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9V13M12 17H12.01"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
