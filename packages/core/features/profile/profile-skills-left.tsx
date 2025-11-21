import { SaveStatusIndicator, SavingModal, SkeletonForm } from '@app/ui'
import { Check } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'
import { InlineSkillSearch, ProfileFormPanel } from './components'
import { MinimalIndustrySelect } from './components/skills/MinimalIndustrySelect'
import { useSaveStatus } from './hooks/useSaveStatus'
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

  // Use save status hook
  const {
    saveStatus,
    lastSavedAt,
    saveError,
    saveButtonState,
    isSaving,
    saveModalError,
    handleRetrySave,
    handleForceSave,
    setSaveModalError,
    setIsSaving,
  } = useSaveStatus(isAddingSkill, isRemovingSkill)

  // Memoize options to prevent unnecessary re-renders
  const industryOptions = useMemo(
    () =>
      industries.map((industry) => ({
        value: industry.id,
        label: industry.name,
      })),
    [industries]
  )

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
        <MinimalIndustrySelect
          value={selectedIndustryId || ''}
          onValueChange={handleIndustryChange}
          placeholder="Select an industry"
          testID="primary-industry-select-trigger"
          options={industryOptions}
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
          externalSearchId={pendingSearch?.id}
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
