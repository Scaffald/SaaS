/**
 * MinusIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

export function MinusIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      role="img"
      aria-label="Indeterminate"
    >
      <path d="M2 6H10" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  )
}
