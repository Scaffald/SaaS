import { YStack, Text, Select, Adapt, Sheet, Separator, Spinner } from 'tamagui'
import { ProfileFormPanel, InlineSkillSearch } from './components'
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
  } = useProfileSkillsContext()

  if (isLoadingIndustries) {
    return (
      <ProfileFormPanel>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading...</Text>
        </YStack>
      </ProfileFormPanel>
    )
  }

  return (
    <ProfileFormPanel>
      {/* Industry Selector */}
      <YStack gap="$2">
        <Text fontWeight="600">Primary Industry *</Text>
        <Text fontSize="$2" color="$color11">
          Select your industry to search for relevant skills
        </Text>
        <Select value={selectedIndustryId} onValueChange={handleIndustryChange} size="$4">
          <Select.Trigger width="100%">
            <Select.Value placeholder="Select an industry" />
          </Select.Trigger>

          <Adapt when="sm" platform="touch">
            <Sheet
              native
              modal
              dismissOnSnapToBottom
              animationConfig={{
                type: 'spring',
                damping: 20,
                mass: 1.2,
                stiffness: 250,
              }}
            >
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay
                animation="lazy"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
              />
            </Sheet>
          </Adapt>

          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton />
            <Select.Viewport>
              {industries.map((industry, index) => {
                return (
                  <Select.Item key={industry.id} value={industry.id} index={index}>
                    <Select.ItemText>{industry.name}</Select.ItemText>
                  </Select.Item>
                )
              })}
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
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
    </ProfileFormPanel>
  )
}
