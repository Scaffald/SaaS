/**
 * Focus mode: a screen asking the shell to stand back.
 *
 * The section's folder tabs are drawn by the shell (`SectionTabs`, rendered
 * once by `DrawerLayout`), not by the screen, so a screen cannot simply leave
 * them out. Taking an assessment is the case that needs to: the prototype's
 * taking screens are one focused column, and ours kept six tabs inviting the
 * worker to wander off mid-test (#1194).
 *
 * A counter rather than a boolean, so two holders (a screen and something it
 * renders) cannot release each other's hold.
 */

import { useEffect, useSyncExternalStore } from 'react'

let holds = 0
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

/** Take a hold; the returned function releases it, once. */
export function holdFocusMode(): () => void {
  holds += 1
  emit()
  let released = false
  return () => {
    if (released) return
    released = true
    holds -= 1
    emit()
  }
}

export function isFocusMode(): boolean {
  return holds > 0
}

export function subscribeFocusMode(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** For the shell: whether any screen currently holds focus mode. */
export function useIsFocusMode(): boolean {
  return useSyncExternalStore(subscribeFocusMode, isFocusMode, () => false)
}

/** For a screen: hold focus mode while mounted and `active`. */
export function useFocusMode(active = true): void {
  useEffect(() => {
    if (!active) return
    return holdFocusMode()
  }, [active])
}
