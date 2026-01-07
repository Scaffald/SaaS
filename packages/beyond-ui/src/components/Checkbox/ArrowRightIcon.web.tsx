/**
 * ArrowRightIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

export function ArrowRightIcon({
  size = 16,
  color = '#141c25',
}: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-label="Collapse"
    >
      <path
        d="M6 12L10 8L6 4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
