import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

/**
 * `false` on the server and during hydration, `true` from the first
 * post-hydration render onward.
 *
 * Use it to gate UI that depends on client-only state (a session read from
 * localStorage, viewport measurements) so the first client render matches the
 * server-rendered tree. Branching on that state directly is how the
 * intermittent "tree will be regenerated on the client" failures in #679/#681
 * happen: when the async state lands before the first client render, the
 * client and server disagree on structure and React throws the tree away.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
