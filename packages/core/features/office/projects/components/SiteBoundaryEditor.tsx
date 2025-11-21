// @ts-expect-error - SiteBoundaryDrawer is not exported from @app/ui, using direct import

import type { Boundary } from '@app/schemas'
import { SiteBoundaryDrawer } from '@app/ui/src/components/map/SiteBoundaryDrawer'

export interface SiteBoundaryEditorProps {
  boundary?: Boundary
  onBoundaryChange?: (boundary: Boundary) => void
  onAreaChange?: (areaSqft: number) => void
}

/**
 * Site Boundary Editor Component
 * Wrapper for SiteBoundaryDrawer with project-specific context
 */
export function SiteBoundaryEditor({
  boundary,
  onBoundaryChange,
  onAreaChange,
}: SiteBoundaryEditorProps) {
  return (
    <SiteBoundaryDrawer
      boundary={boundary}
      onBoundaryChange={onBoundaryChange}
      onAreaChange={onAreaChange}
    />
  )
}
