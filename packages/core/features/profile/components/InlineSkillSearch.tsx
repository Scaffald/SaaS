import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { YStack, XStack, Text, Button, Slider, Card, Separator, Label } from 'tamagui'
import { SearchSelect, type SearchSelectOption } from '@app/ui'
import { CustomCheckbox } from '@app/ui'

/**
 * Parent skill from search (multi-taxonomy format)
 */
export interface ParentSkill {
  id: string
  name: string
  code: string
  depth: number
}

/**
 * Props for InlineSkillSearch
 */
export interface InlineSkillSearchProps {
  /** Function to search skills with taxonomies */
  onSearchSkills: (query: string, taxonomies: string[]) => Promise<ParentSkill[]>
  /** Callback when skill is selected and added */
  onSelectSkill: (
    skillId: string,
    proficiency: number,
    taxonomy: string,
    skillDetails?: ParentSkill
  ) => void
  /** Whether search is loading */
  isSearching?: boolean
  /** Existing skill IDs that user has already added */
  existingSkillIds?: string[]
  /** External term injected from parent (e.g., chip selection) */
  externalSearchTerm?: string | null
  /** Preferred taxonomy when external term provided */
  externalSearchTaxonomy?: 'csi' | 'onet' | 'both'
  /** Callback when external term has been consumed */
  onConsumeExternalSearchTerm?: () => void
}

/**
 * Proficiency levels for skills
 */
const PROFICIENCY_LEVELS = [
  { value: 1, label: 'Beginner', description: 'Learning the basics' },
  { value: 2, label: 'Novice', description: 'Some experience' },
  { value: 3, label: 'Intermediate', description: 'Comfortable with most tasks' },
  { value: 4, label: 'Advanced', description: 'Highly skilled' },
  { value: 5, label: 'Expert', description: 'Industry leader' },
] as const

/**
 * InlineSkillSearch Component
 *
 * Inline component for searching and selecting skills with proficiency
 *
 * @example
 * ```tsx
 * <InlineSkillSearch
 *   onSearchSkills={async (query, taxonomies) => {
 *     const result = await searchSkillsMutation.mutateAsync({ query, taxonomies })
 *     return result.skills
 *   }}
 *   onSelectSkill={(skillId, proficiency, taxonomy) => {
 *     addSkillMutation.mutate({ skillId, proficiency, taxonomy })
 *   }}
 *   existingSkillIds={userSkills.map(s => s.id)}
 * />
 * ```
 */
export function InlineSkillSearch({
  onSearchSkills,
  onSelectSkill,
  isSearching = false,
  existingSkillIds = [],
  externalSearchTerm,
  externalSearchTaxonomy,
  onConsumeExternalSearchTerm,
}: InlineSkillSearchProps) {
  const [selectedSkill, setSelectedSkill] = useState<ParentSkill | null>(null)
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string>('csi')
  const [proficiency, setProficiency] = useState(1)
  const [searchCSI, setSearchCSI] = useState(true)
  const [searchONET, setSearchONET] = useState(false)
  const lastExternalTermRef = useRef<string | null>(null)

  // Handle search with taxonomy filtering
  const handleSearch = useCallback(
    async (query: string): Promise<ParentSkill[]> => {
      if (query.trim().length < 2) {
        return []
      }

      const taxonomies: string[] = []
      if (searchCSI) taxonomies.push('csi')
      if (searchONET) taxonomies.push('onet')

      if (taxonomies.length === 0) {
        return []
      }

      const results = await onSearchSkills(query, taxonomies)

      // Filter out existing skills to prevent duplicates
      return results.filter((skill) => !existingSkillIds.includes(skill.id))
    },
    [onSearchSkills, searchCSI, searchONET, existingSkillIds]
  )

  // Apply external search term when provided (e.g., suggestion chip)
  useEffect(() => {
    if (!externalSearchTerm || externalSearchTerm === lastExternalTermRef.current) {
      return
    }

    lastExternalTermRef.current = externalSearchTerm
    if (externalSearchTaxonomy === 'onet') {
      setSearchCSI(false)
      setSearchONET(true)
    } else if (externalSearchTaxonomy === 'csi') {
      setSearchCSI(true)
      setSearchONET(false)
    } else if (externalSearchTaxonomy === 'both') {
      setSearchCSI(true)
      setSearchONET(true)
    } else {
      // Default to searching both taxonomies for suggestions
      setSearchCSI(true)
      setSearchONET(true)
    }

    onConsumeExternalSearchTerm?.()
  }, [externalSearchTerm, externalSearchTaxonomy, onConsumeExternalSearchTerm])

  // Handle skill selection
  const handleSkillSelect = useCallback((skill: ParentSkill, taxonomy: string) => {
    setSelectedSkill(skill)
    setSelectedTaxonomy(taxonomy)
    setProficiency(1) // Reset to default (Beginner)
  }, [])

  // Handle add skill
  const handleAddSkill = useCallback(() => {
    if (selectedSkill) {
      onSelectSkill(
        selectedSkill.id,
        proficiency,
        selectedTaxonomy,
        selectedSkill
      )
      // Reset to search mode but keep search query
      setSelectedSkill(null)
      setSelectedTaxonomy('csi')
      setProficiency(1) // Reset to default (Beginner)
    }
  }, [selectedSkill, proficiency, selectedTaxonomy, onSelectSkill])

  // Handle cancel
  const handleCancel = useCallback(() => {
    setSelectedSkill(null)
    setProficiency(1) // Reset to default (Beginner)
  }, [])

  // Get current proficiency level details
  const currentLevel = useMemo(
    () => PROFICIENCY_LEVELS.find((level) => level.value === proficiency),
    [proficiency]
  )

  // If a skill is selected, show proficiency selector
  if (selectedSkill) {
    return (
      <YStack gap="$4">
        <Text fontWeight="600" fontSize="$4">
          Set Proficiency Level
        </Text>

        {/* Selected Skill */}
        <Card bordered bg="$color3">
          <Card.Header>
            <YStack gap="$1">
              <Text fontSize="$4" fontWeight="600">
                {selectedSkill.name}
              </Text>
              {selectedSkill.code && (
                <Text fontSize="$2" color="$color10">
                  {selectedSkill.code} ({selectedTaxonomy.toUpperCase()})
                </Text>
              )}
            </YStack>
          </Card.Header>
        </Card>

        <Separator />

        {/* Proficiency Slider */}
        <YStack gap="$3">
          <Text fontWeight="600">Proficiency</Text>

          <Slider
            value={[proficiency]}
            onValueChange={(value) => setProficiency(value[0])}
            min={1}
            max={5}
            step={1}
            size="$3"
          >
            <Slider.Track bg="$color4" height={6}>
              <Slider.TrackActive bg="$green9" />
            </Slider.Track>
            <Slider.Thumb index={0} circular size="$1" />
          </Slider>

          {/* Current Level Display */}
          <Card bordered bg="$color3">
            <Card.Header>
              <XStack justify="space-between" items="center">
                <YStack>
                  <Text fontWeight="600" fontSize="$4" color="$green9">
                    {currentLevel?.label}
                  </Text>
                  <Text fontSize="$2" color="$color11">
                    {currentLevel?.description}
                  </Text>
                </YStack>
                <Text fontSize="$8" fontWeight="bold" color="$green9">
                  {proficiency}
                </Text>
              </XStack>
            </Card.Header>
          </Card>

          {/* Level Guide */}
          <YStack gap="$2">
            {PROFICIENCY_LEVELS.map((level) => (
              <XStack
                key={level.value}
                gap="$2"
                items="center"
                opacity={proficiency === level.value ? 1 : 0.5}
              >
                <Text fontWeight="600" minW={30}>
                  {level.value}
                </Text>
                <Text flex={1} fontSize="$2">
                  {level.label} - {level.description}
                </Text>
              </XStack>
            ))}
          </YStack>
        </YStack>

        {/* Actions */}
        <XStack gap="$3">
          <Button flex={1} variant="outlined" onPress={handleCancel}>
            Cancel
          </Button>
          <Button flex={1} themeInverse onPress={handleAddSkill}>
            Add Skill
          </Button>
        </XStack>
      </YStack>
    )
  }

  // Handle skill selection from SearchSelect
  const handleChange = useCallback(
    (value: ParentSkill | ParentSkill[] | null) => {
      if (value && !Array.isArray(value)) {
        // Determine taxonomy from skill code (CSI codes are numeric, O*NET have dashes)
        const taxonomy = value.code.includes('-') ? 'onet' : 'csi'
        handleSkillSelect(value, taxonomy)
      }
    },
    [handleSkillSelect]
  )

  // Custom render function for skill results
  const renderOption = useCallback(
    (option: SearchSelectOption<ParentSkill>, _state: { isActive: boolean; isSelected: boolean; index: number }) => {
      const skill = option.raw
      const isExisting = existingSkillIds.includes(skill.id)
      // Determine taxonomy from skill code (CSI codes are numeric, O*NET have dashes)
      const taxonomy = skill.code.includes('-') ? 'onet' : 'csi'
      return (
        <Card
          size="$4"
          bordered
          borderColor={isExisting ? '$blue9' : undefined}
          borderWidth={isExisting ? 2 : 1}
          pressStyle={{ scale: 0.98, bg: '$color5' }}
          animation="quick"
        >
          <Card.Header>
            <XStack justify="space-between" items="center">
              <YStack flex={1}>
                <Text fontSize="$4" fontWeight="600">
                  {skill.name}
                </Text>
                {skill.code && (
                  <Text fontSize="$2" color="$color10">
                    {skill.code} ({taxonomy.toUpperCase()})
                  </Text>
                )}
              </YStack>
              {isExisting && (
                <Text fontSize="$2" color="$blue9" fontWeight="600">
                  Added
                </Text>
              )}
            </XStack>
          </Card.Header>
        </Card>
      )
    },
    [existingSkillIds]
  )

  // Show search interface
  return (
    <YStack gap="$4">
      <XStack justify="space-between" items="center">
        <Text fontWeight="600" fontSize="$4">
          Search for Skills
        </Text>

        {/* Taxonomy Checkboxes */}
        <XStack gap="$3" items="center">
          <XStack gap="$2" items="center">
            <CustomCheckbox
              checked={searchCSI}
              onCheckedChange={(checked) => setSearchCSI(checked)}
              aria-label="Filter CSI taxonomy"
              testID="search-csi"
            />
            <Label fontSize="$2" onPress={() => setSearchCSI((prev) => !prev)}>
              CSI
            </Label>
          </XStack>

          <XStack gap="$2" items="center">
            <CustomCheckbox
              checked={searchONET}
              onCheckedChange={(checked) => setSearchONET(checked)}
              aria-label="Filter O*NET taxonomy"
              testID="search-onet"
            />
            <Label fontSize="$2" onPress={() => setSearchONET((prev) => !prev)}>
              O*NET
            </Label>
          </XStack>
        </XStack>
      </XStack>

      {/* SearchSelect Component */}
      <SearchSelect<ParentSkill>
        mode="single"
        onSearch={handleSearch}
        onChange={handleChange}
        getOptionLabel={(skill: ParentSkill) => skill.name}
        getOptionValue={(skill: ParentSkill) => skill.id}
        getOptionDescription={(skill: ParentSkill) => skill.code || undefined}
        placeholder="Search for a skill (e.g., Concrete, Plumbing)..."
        minSearchLength={2}
        debounceMs={300}
        isLoading={isSearching}
        renderOption={renderOption}
        inputValue={externalSearchTerm || undefined}
        strings={{
          noResults: 'No skills found',
          minCharacters: (count: number) => `Type at least ${count} characters to search`,
        }}
      />
    </YStack>
  )
}
