import {
  DashboardWidget,
  ResponsiveSelect,
  SaveStatusIndicator,
  SavingModal,
  SkeletonForm,
} from '@unicornlove/beyond-ui'
import { Check } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import { Button, ScrollView, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { InlineSkillSearch } from './components'
import { SoftSkillsRatingForm } from './components/SoftSkillsRatingForm'
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack gap="$4">
          <DashboardWidget>
            <Stack gap="$4" padding="$4">
              <SkeletonForm fields={4} />
            </Stack>
          </DashboardWidget>
          <DashboardWidget>
            <Stack gap="$4" padding="$4">
              <SkeletonForm fields={6} />
            </Stack>
          </DashboardWidget>
        </Stack>
      </ScrollView>
    )
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Stack gap="$4">
        <DashboardWidget>
          <Stack gap="$4">
            {/* Header with Save Status Indicator */}
            <Row justifyContent="space-between" alignItems="center" marginBottom="$2">
              <Stack flex={1} />
              <SaveStatusIndicator
                status={saveStatus}
                lastSavedAt={lastSavedAt}
                error={saveError}
              />
            </Row>

            {/* Industry Selector */}
            <Stack gap="$2">
              <ResponsiveSelect
                value={selectedIndustryId || ''}
                onValueChange={handleIndustryChange}
                placeholder="Select an industry"
                label="Primary Industry *"
                options={industryOptions}
                disabled={isLoadingIndustries}
                testID="primary-industry-select-trigger"
                sheetTitle="Select Industry"
              />
              <Text fontSize="$2" color="$color11">
                Select your industry to search for relevant skills
              </Text>
            </Stack>

            <Separator />

            {/* Inline Skill Search */}
            {!selectedIndustryId ? (
              <Stack
                padding="$4"
                alignItems="center"
                gap="$2"
                backgroundColor="$color3"
                borderRadius="$4"
              >
                <Text fontSize="$3" color="$color11" textAlign="center">
                  Please select an industry above to search for skills
                </Text>
              </Stack>
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
            <Row justifyContent="flex-end" paddingTop="$2">
              <Button
                size="$4"
                themeInverse
                onPress={handleForceSave}
                disabled={saveButtonState === 'saving' || saveButtonState === 'saved'}
                icon={saveButtonState === 'saved' ? Check : undefined}
              >
                {saveButtonState === 'saving' ? (
                  <Row gap="$2" alignItems="center">
                    <Spinner size="small" />
                    <Text>Saving...</Text>
                  </Row>
                ) : saveButtonState === 'saved' ? (
                  'Saved ✓'
                ) : (
                  'Save'
                )}
              </Button>
            </Row>

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
          </Stack>
        </DashboardWidget>

        <DashboardWidget>
          <SoftSkillsRatingForm />
        </DashboardWidget>
      </Stack>
    </ScrollView>
  )
}
