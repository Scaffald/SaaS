export type HoverCardViewport = {
  width: number
  height: number
}

export type HoverCardPadding = {
  horizontal: number
  vertical: number
}

const MIN_PADDING = 80
const EDGE_OFFSET = 32

export const computeHoverCardPadding = (
  viewport: HoverCardViewport | null,
  basePadding: HoverCardPadding
) => {
  if (!viewport) {
    return {
      horizontal: basePadding.horizontal,
      vertical: basePadding.vertical,
    }
  }

  const horizontal = Math.max(
    MIN_PADDING,
    Math.min(basePadding.horizontal, Math.max(viewport.width / 2 - EDGE_OFFSET, MIN_PADDING))
  )

  const vertical = Math.max(
    MIN_PADDING,
    Math.min(basePadding.vertical, Math.max(viewport.height / 2 - EDGE_OFFSET, MIN_PADDING))
  )

  return {
    horizontal,
    vertical,
  }
}

export const isPinNearViewportEdge = (
  coords: { x: number; y: number } | null,
  viewport: HoverCardViewport | null,
  basePadding: HoverCardPadding
) => {
  if (!coords || !viewport) {
    return false
  }

  const padding = computeHoverCardPadding(viewport, basePadding)

  return (
    coords.x < padding.horizontal ||
    coords.x > viewport.width - padding.horizontal ||
    coords.y < padding.vertical ||
    coords.y > viewport.height - padding.vertical
  )
}
