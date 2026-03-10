import {
  DashboardWidget,
  ResponsiveSelect,
  SaveStatusIndicator,
  SavingModal,
  SkeletonForm,
} from '@scaffald/ui'
import { Check, Sparkles } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { Button, ScrollView, Separator, Text, Row, Stack } from '@scaffald/ui'
import { useUserSkillsMultiTaxonomy } from '@scf/core/utils/profile-skills-sdk-hooks'
import { InlineSkillSearch } from './components'
import { SkillSuggestionsModal } from './components/SkillSuggestionsModal'
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

  // O*NET skill suggestions modal state
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
  const [isAddingOnetSkills, setIsAddingOnetSkills] = useState(false)

  // Get existing skill names for deduplication in suggestions modal
  const { data: userSkillsData } = useUserSkillsMultiTaxonomy()
  const existingSkillNames = useMemo(
    () =>
      (userSkillsData?.skills || [])
        .map((s) => (s.skill_details as { name?: string } | null)?.name || '')
        .filter(Boolean),
    [userSkillsData?.skills]
  )

  // Handle adding skills from O*NET suggestions
  const handleAddOnetSkills = useCallback(
    async (skills: Array<{ name: string; onetCode: string; proficiency: number; taxonomy: string }>) => {
      setIsAddingOnetSkills(true)
      try {
        for (const skill of skills) {
          // Pass O*NET code as skillId (stored in onet_occupation_id),
          // and skill details with the display name for optimistic updates
          await selectSkill(skill.onetCode, skill.proficiency, skill.taxonomy, {
            id: skill.onetCode,
            name: skill.name,
            code: skill.onetCode,
            depth: 0,
          })
        }
        setShowSuggestionsModal(false)
      } catch (error) {
        console.error('Failed to add O*NET skills:', error)
      } finally {
        setIsAddingOnetSkills(false)
      }
    },
    [selectSkill]
  )

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
              <Text style={{ color: '#414e62' }}>Select your industry to search for relevant skills</Text>
            </Stack>

            <Separator />

            {/* Inline Skill Search */}
            {!selectedIndustryId ? (
              <Stack
                padding="md"
                align="center"
                gap={8}
                borderRadius={16}
              >
                <Text style={{ color: '#414e62', textAlign: 'center' }}>
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

            {/* Quick Add from O*NET */}
            <Button
              size="sm"
              variant="outline"
              iconStart={Sparkles}
              onPress={() => setShowSuggestionsModal(true)}
            >
              Quick Add from O*NET
            </Button>

            <Separator />

            {/* Save Button */}
            <Row justify="space-between" align="center" paddingTop={8}>
              <SaveStatusIndicator
                status={saveStatus}
                lastSavedAt={lastSavedAt}
                error={saveError}
              />
              <Button
                size="md"
                onPress={handleForceSave}
                disabled={saveButtonState === 'saving' || saveButtonState === 'saved'}
                iconStart={saveButtonState === 'saved' ? Check : undefined}
              >
                {saveButtonState === 'saving' ? 'Saving…' : saveButtonState === 'saved' ? 'Saved ✓' : 'Save'}
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

      {/* O*NET Skill Suggestions Modal */}
      <SkillSuggestionsModal
        visible={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        onAddSkills={handleAddOnetSkills}
        existingSkillNames={existingSkillNames}
        isAdding={isAddingOnetSkills}
      />
    </ScrollView>
  )
}
