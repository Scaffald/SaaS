/**
 * AIIcon component (Web version)
 * Uses plain SVG for web/Storybook compatibility
 */

interface AIIconProps {
  color: string
  size?: number
}

export function AIIcon({ color, size = 24 }: AIIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="AI">
      {/* Main sparkle */}
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill={color}
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small sparkle top right */}
      <path d="M19 4L19.5 5.5L21 6L19.5 6.5L19 8L18.5 6.5L17 6L18.5 5.5L19 4Z" fill={color} />
      {/* Small sparkle bottom left */}
      <path d="M5 16L5.5 17.5L7 18L5.5 18.5L5 20L4.5 18.5L3 18L4.5 17.5L5 16Z" fill={color} />
    </svg>
  )
}
