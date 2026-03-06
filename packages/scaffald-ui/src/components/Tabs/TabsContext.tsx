/**
 * Tabs context – shared state for Tabs compound component.
 * Extracted to avoid require cycles between Tabs.tsx, TabTrigger, TabItem, TabContent.
 */

import { createContext, useContext } from 'react'
import type { TabsContextValue } from './Tabs.types'

export const TabsContext = createContext<TabsContextValue | null>(null)

export function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component')
  }
  return context
}
