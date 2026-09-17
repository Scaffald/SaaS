import type { ServerViewport } from '@scaffald/ui'

/** Native measures its window; there is no server render to hint. */
export function useServerViewportHint(): ServerViewport | undefined {
  return undefined
}
