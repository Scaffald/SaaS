import {
  DashboardWidget,
  ResponsiveSelect,
  SaveStatusIndicator,
  SavingModal,
  SkeletonForm,
} , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { Check } from 'lucide-react-native'
import { useMemo } from 'react'
import { Button, ScrollView, Separator, Spinner, Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'
import { InlineSkillSearch } from './components'
import { SoftSkillsRatingForm } from './components/SoftSkillsRatingForm'
import { useSaveStatus } from './hooks/useSaveStatus'
import { useProfileSkillsContext } from './profile-skills-context'

/**
 * Profile Skills Left Component
 * Inline form for searching and adding skills
 */
export function ProfileSkillsLeft() {
  const { theme } = useThemeContext()
) {
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
        <Stack gap={16}>
          <DashboardWidget>
            <Stack gap={16} padding="md">
              <SkeletonForm fields={4} />
            </Stack>
          </DashboardWidget>
          <DashboardWidget>
            <Stack gap={16} padding="md">
              <SkeletonForm fields={6} />
            </Stack>
          </DashboardWidget>
        </Stack>
      </ScrollView>
    )
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Stack gap={16}>
        <DashboardWidget>
          <Stack gap={16}>
            {/* Header with Save Status Indicator */}
            <Row justify="space-between" align="center" marginBottom={8}>
              <Stack flex={1} />
              <SaveStatusIndicator
                status={saveStatus}
                lastSavedAt={lastSavedAt}
                error={saveError}
              />
            </Row>

            {/* Industry Selector */}
            <Stack gap={8}>
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
              <Text style={{ color: colors.text[theme].secondary }}>Select your industry to search for relevant skills</Text>
            </Stack>

            <Separator />

            {/* Inline Skill Search */}
            {!selectedIndustryId ? (
              <Stack
                padding="md"
                align="center"
                gap={8}
                backgroundColor={colors.bg[theme].muted}
                borderRadius={16}
              >
                <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
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
            <Row justify="flex-end" paddingTop={8}>
              <Button
                size="md"
                themeInverse
                onPress={handleForceSave}
                disabled={saveButtonState === 'saving' || saveButtonState === 'saved'}
                iconStart={saveButtonState === 'saved' ? Check : undefined}
              >
                {saveButtonState === 'saving' ? (
                  <Row gap={8} align="center">
                    <Spinner size="sm" />
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
