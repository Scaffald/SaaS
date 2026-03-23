/**
 * usePageBottomBar — auto-registers/unregisters a page-level bar.
 *
 * Call from a BottomBar with `level="page"` to automatically hide
 * the global bar while this bar is mounted.
 */

import { useEffect, useRef } from 'react'
import { useBottomBarContext } from '../BottomBarProvider'

let nextId = 0

export function usePageBottomBar(externalId?: string, enabled = true) {
  const { registerPageBar, unregisterPageBar } = useBottomBarContext()
  const idRef = useRef(externalId ?? `page-bar-${++nextId}`)

  useEffect(() => {
    if (!enabled) return
    const id = idRef.current
    registerPageBar(id)
    return () => unregisterPageBar(id)
  }, [enabled, registerPageBar, unregisterPageBar])

  return idRef.current
}
