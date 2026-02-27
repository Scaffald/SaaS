/**
 * ArrowDownIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

export function ArrowDownIcon({ size = 16, color = '#141c25' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" role="img" aria-label="Expand">
      <path
        d="M4 6L8 10L12 6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
