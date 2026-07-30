import { useState } from 'react'

/**
 * Pointer-hover state for marketing surfaces.
 *
 * react-native-web forwards `onMouseEnter`/`onMouseLeave` to the DOM node but
 * React Native's own types don't declare them, so the cast is contained here
 * rather than repeated at each call site.
 */
export function useHover() {
  const [hovered, setHovered] = useState(false)

  const hoverProps = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } as Record<string, unknown>

  return { hovered, hoverProps }
}
