import type { SaveStatus } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useUnsavedChangesPrompt } from '@scf/core/utils/platform'

/**
 * Hook for tracking save status across profile pages
 * Monitors mutations and provides save status, navigation guards, and forced save functionality
 */
export function useSaveStatus(isAdding: boolean, isRemoving: boolean) {
  const queryClient = useQueryClient()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>()
  const [saveError, setSaveError] = useState<string | undefined>()
  const [saveButtonState, setSaveButtonState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveModalError, setSaveModalError] = useState<string | undefined>()

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isAdding || isRemoving)
  }, [isAdding, isRemoving])

  // Track when mutations start - set status to 'saving'
  useEffect(() => {
    if (isAdding || isRemoving) {
      setSaveStatus((prevStatus) => {
        // Only update if not already saving to avoid unnecessary updates
        if (prevStatus !== 'saving') {
          return 'saving'
        }
        return prevStatus
      })
      setSaveError(undefined)
    }
  }, [isAdding, isRemoving])

  // Track when mutations complete - set status to 'saved' then 'idle'
  useEffect(() => {
    if (!isAdding && !isRemoving) {
      setSaveStatus((prevStatus) => {
        // Only transition from 'saving' to 'saved'
        if (prevStatus === 'saving') {
          setLastSavedAt(new Date())
          return 'saved'
        }
        return prevStatus
      })
    }
  }, [isAdding, isRemoving])

  // Reset status to idle after being saved for 3 seconds
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timeoutId = setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
      return () => clearTimeout(timeoutId)
    }
  }, [saveStatus])

  useUnsavedChangesPrompt(hasUnsavedChanges)

  // Handle forced save before navigation
  const handleForcedSave = async (): Promise<boolean> => {
    if (!hasUnsavedChanges) return true

    setIsSaving(true)
    setSaveModalError(undefined)

    try {
      // Wait for pending mutations to complete with timeout
      await Promise.race([
        new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            if (!isAdding && !isRemoving) {
              clearInterval(checkInterval)
              resolve()
            }
          }, 100)
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Save timeout')), 5000)
        ),
      ])
      setIsSaving(false)
      return true
    } catch (error) {
      setIsSaving(false)
      setSaveModalError(error instanceof Error ? error.message : 'Failed to save changes')
      return false
    }
  }

  // Handle retry save
  const handleRetrySave = async () => {
    const success = await handleForcedSave()
    if (success) {
      setSaveModalError(undefined)
    }
  }

  // Handle force save - refetch to sync with server
  const handleForceSave = async () => {
    setSaveStatus('saving')
    setSaveButtonState('saving')
    setSaveError(undefined)

    try {
      // Force refetch to sync with server
      await queryClient.invalidateQueries({
        queryKey: ['scaffald', 'skills', 'multi-taxonomy'],
      })
      setSaveStatus('saved')
      setSaveButtonState('saved')
      setLastSavedAt(new Date())

      // Reset button state after 2 seconds
      setTimeout(() => {
        setSaveButtonState('idle')
      }, 2000)

      // Reset save status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (error) {
      setSaveStatus('error')
      setSaveButtonState('idle')
      setSaveError(error instanceof Error ? error.message : 'Failed to save')
    }
  }

  return {
    saveStatus,
    lastSavedAt,
    saveError,
    saveButtonState,
    hasUnsavedChanges,
    isSaving,
    saveModalError,
    handleForcedSave,
    handleRetrySave,
    handleForceSave,
    setSaveModalError,
    setIsSaving,
  }
}
