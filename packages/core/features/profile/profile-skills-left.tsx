import { api } from '@app/core/utils/api'
import {
  type SaveStatus,
  SaveStatusIndicator,
  SavingModal,
  SkeletonForm,
  ResponsiveSelect,
} from '@app/ui'
import { Check } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'
import { InlineSkillSearch, ProfileFormPanel } from './components'
import { useProfileSkillsContext } from './profile-skills-context'

/**
 * Profile Skills Left Component
 * Inline form for searching and adding skills
 */
export function ProfileSkillsLeft() {
  const {
    isLoadingIndustries,
    industries,
    selectedIndustryId,
    handleIndustryChange,
    pendingSearch,
    clearPendingSearch,
    searchSkills,
    selectSkill,
    isSearchingSkills,
    existingSkillIds,
    isAddingSkill,
    isRemovingSkill,
  } = useProfileSkillsContext()

  const _router = useRouter()
  const utils = api.useUtils()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | undefined>()
  const [saveError, setSaveError] = useState<string | undefined>()
  const [saveButtonState, setSaveButtonState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveModalError, setSaveModalError] = useState<string | undefined>()

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(isAddingSkill || isRemovingSkill)
  }, [isAddingSkill, isRemovingSkill])

  // Track when mutations start - set status to 'saving'
  useEffect(() => {
    if (isAddingSkill || isRemovingSkill) {
      setSaveStatus((prevStatus) => {
        // Only update if not already saving to avoid unnecessary updates
        if (prevStatus !== 'saving') {
          return 'saving'
        }
        return prevStatus
      })
      setSaveError(undefined)
    }
  }, [isAddingSkill, isRemovingSkill])

  // Track when mutations complete - set status to 'saved' then 'idle'
  useEffect(() => {
    if (!isAddingSkill && !isRemovingSkill) {
      setSaveStatus((prevStatus) => {
        // Only transition from 'saving' to 'saved'
        if (prevStatus === 'saving') {
          setLastSavedAt(new Date())
          return 'saved'
        }
        return prevStatus
      })
    }
  }, [isAddingSkill, isRemovingSkill])

  // Reset status to idle after being saved for 3 seconds
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timeoutId = setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
      return () => clearTimeout(timeoutId)
    }
  }, [saveStatus])

  // Browser navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '' // Required for Chrome
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

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
            if (!isAddingSkill && !isRemovingSkill) {
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

  // Handle force save
  const handleForceSave = async () => {
    setSaveStatus('saving')
    setSaveButtonState('saving')
    setSaveError(undefined)

    try {
      // Force refetch to sync with server
      await utils.profile.skillsMultiTaxonomy.getUserSkills.refetch()
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

  if (isLoadingIndustries) {
    return (
      <ProfileFormPanel>
        <YStack gap="$4" p="$4">
          <SkeletonForm fields={4} />
        </YStack>
      </ProfileFormPanel>
    )
  }

  return (
    <ProfileFormPanel>
      {/* Header with Save Status Indicator */}
      <XStack justify="space-between" items="center" mb="$2">
        <YStack flex={1} />
        <SaveStatusIndicator status={saveStatus} lastSavedAt={lastSavedAt} error={saveError} />
      </XStack>

      {/* Industry Selector */}
      <YStack gap="$2">
        <Text fontWeight="600">Primary Industry *</Text>
        <Text fontSize="$2" color="$color11">
          Select your industry to search for relevant skills
        </Text>
        <ResponsiveSelect
          value={selectedIndustryId || ''}
          onValueChange={handleIndustryChange}
          placeholder="Select an industry"
          testID="primary-industry-select-trigger"
          options={industries.map((industry) => ({
            value: industry.id,
            label: industry.name,
          }))}
        />
      </YStack>

      <Separator />

      {/* Inline Skill Search */}
      {!selectedIndustryId ? (
        <YStack p="$4" items="center" gap="$2" bg="$color3" rounded="$4">
          <Text fontSize="$3" color="$color11" text="center">
            Please select an industry above to search for skills
          </Text>
        </YStack>
      ) : (
        <InlineSkillSearch
          onSearchSkills={searchSkills}
          onSelectSkill={selectSkill}
          isSearching={isSearchingSkills}
          existingSkillIds={existingSkillIds}
          externalSearchTerm={pendingSearch?.term ?? null}
          externalSearchTaxonomy={pendingSearch?.taxonomy}
          onConsumeExternalSearchTerm={clearPendingSearch}
        />
      )}

      <Separator />

      {/* Save Button */}
      <XStack justify="flex-end" pt="$2">
        <Button
          size="$4"
          themeInverse
          onPress={handleForceSave}
          disabled={saveButtonState === 'saving' || saveButtonState === 'saved'}
          icon={saveButtonState === 'saved' ? Check : undefined}
        >
          {saveButtonState === 'saving' ? (
            <XStack gap="$2" items="center">
              <Spinner size="small" />
              <Text>Saving...</Text>
            </XStack>
          ) : saveButtonState === 'saved' ? (
            'Saved ✓'
          ) : (
            'Save'
          )}
        </Button>
      </XStack>

      {/* Saving Modal for Navigation Safety */}
      <SavingModal
        open={isSaving}
        onClose={() => {
          setIsSaving(false)
          setSaveModalError(undefined)
        }}
        isError={!!saveModalError}
        errorMessage={saveModalError}
        onRetry={handleRetrySave}
      />
    </ProfileFormPanel>
  )
}
