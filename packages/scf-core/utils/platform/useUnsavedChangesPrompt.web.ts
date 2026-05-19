import { useEffect } from 'react'
import type { UseUnsavedChangesPrompt } from './useUnsavedChangesPrompt'

export const useUnsavedChangesPrompt: UseUnsavedChangesPrompt = (isDirty) => {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // Required for Chrome to show the prompt.
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])
}
