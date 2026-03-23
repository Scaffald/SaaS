/**
 * BottomBarProvider — context that manages global/page bar visibility.
 *
 * Wrap the app root with this provider. When any page-level BottomBar
 * mounts, the global bar automatically hides. No CSS hacks needed.
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { BottomBarContextValue } from './BottomBar.types'

const BottomBarContext = createContext<BottomBarContextValue>({
  globalBarHidden: false,
  registerPageBar: () => {},
  unregisterPageBar: () => {},
})

export function BottomBarProvider({ children }: { children: ReactNode }) {
  const [pageBarCount, setPageBarCount] = useState(0)
  const registeredIds = useRef(new Set<string>())

  const registerPageBar = useCallback((id: string) => {
    if (!registeredIds.current.has(id)) {
      registeredIds.current.add(id)
      setPageBarCount(registeredIds.current.size)
    }
  }, [])

  const unregisterPageBar = useCallback((id: string) => {
    if (registeredIds.current.has(id)) {
      registeredIds.current.delete(id)
      setPageBarCount(registeredIds.current.size)
    }
  }, [])

  const value = useMemo<BottomBarContextValue>(
    () => ({
      globalBarHidden: pageBarCount > 0,
      registerPageBar,
      unregisterPageBar,
    }),
    [pageBarCount, registerPageBar, unregisterPageBar]
  )

  return (
    <BottomBarContext.Provider value={value}>
      {children}
    </BottomBarContext.Provider>
  )
}

export function useBottomBarContext(): BottomBarContextValue {
  return useContext(BottomBarContext)
}
