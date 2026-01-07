/**
 * CheckIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

export function CheckIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" role="img" aria-label="Checked">
      <path
        d="M10 3L4.5 8.5L2 6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
