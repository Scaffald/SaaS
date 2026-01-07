/**
 * ChevronIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

interface ChevronIconProps {
  expanded: boolean
  color: string
  size?: number
}

export function ChevronIcon({ expanded, color, size = 24 }: ChevronIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label={expanded ? 'Collapse' : 'Expand'}
      style={{
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 200ms ease-in-out',
      }}
    >
      <path
        d="M6 9L12 15L18 9"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
