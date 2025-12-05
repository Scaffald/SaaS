import { createContext, type ReactNode, useCallback, useContext, useState } from 'react'

interface ExperienceEditContextValue {
  editingEntryId: string | null
  startEditing: (entryId: string) => void
  cancelEditing: () => void
}

const ExperienceEditContext = createContext<ExperienceEditContextValue | undefined>(undefined)

export function ExperienceEditProvider({ children }: { children: ReactNode }) {
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  const startEditing = useCallback((entryId: string) => {
    setEditingEntryId(entryId)
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingEntryId(null)
  }, [])

  return (
    <ExperienceEditContext.Provider
      value={{
        editingEntryId,
        startEditing,
        cancelEditing,
      }}
    >
      {children}
    </ExperienceEditContext.Provider>
  )
}

export function useExperienceEdit() {
  const context = useContext(ExperienceEditContext)
  if (!context) {
    throw new Error('useExperienceEdit must be used within ExperienceEditProvider')
  }
  return context
}
