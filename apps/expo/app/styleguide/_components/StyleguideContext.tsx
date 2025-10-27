import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import auditPayload from '../_data/audit-report.json'
import { navGroups } from '../_data/navigation'

export type SearchEntry = {
  title: string
  path: string
  groupId: string
  description?: string
  keywords?: string[]
}

export type StyleguideContextValue = {
  navGroups: typeof navGroups
  audit: typeof auditPayload.audit
  approvalQueue: typeof auditPayload.approvalQueue
  unknowns: typeof auditPayload.unknowns
  searchIndex: SearchEntry[]
  searchQuery: string
  setSearchQuery: (value: string) => void
}

const StyleguideContext = createContext<StyleguideContextValue | null>(null)

export function StyleguideProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')

  const searchIndex = useMemo(() => {
    const entries: SearchEntry[] = []
    for (const group of navGroups) {
      for (const item of group.items) {
        entries.push({
          title: item.title,
          path: item.path,
          groupId: group.id,
          description: item.description,
        })
      }
    }

    entries.push(
      ...Object.entries(auditPayload.audit.designSystem).map(([key, value]) => ({
        title: `Token: ${key}`,
        path: '/styleguide/basics/design-tokens',
        groupId: 'basics',
        description: Array.isArray(value) ? value.join(', ') : String(value),
        keywords: Array.isArray(value) ? value.map(String) : [String(value)],
      })),
    )

    return entries
  }, [])

  const value: StyleguideContextValue = {
    navGroups,
    audit: auditPayload.audit,
    approvalQueue: auditPayload.approvalQueue,
    unknowns: auditPayload.unknowns,
    searchIndex,
    searchQuery,
    setSearchQuery,
  }

  return <StyleguideContext.Provider value={value}>{children}</StyleguideContext.Provider>
}

export function useStyleguideContext() {
  const ctx = useContext(StyleguideContext)
  if (!ctx) {
    throw new Error('useStyleguideContext must be used within StyleguideProvider')
  }
  return ctx
}
