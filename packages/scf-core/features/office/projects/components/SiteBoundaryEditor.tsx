import type { Boundary } from '@scaffald/ui'
import { SiteBoundaryDrawer } from '@scf/core/components/sites'

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
