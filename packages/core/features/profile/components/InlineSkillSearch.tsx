import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { YStack, XStack, Text, Button, Input, Spinner, Slider, Card, Separator, Label } from 'tamagui'
import { Search } from '@tamagui/lucide-icons'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ParentSkill[]>([])
  const [selectedSkill, setSelectedSkill] = useState<ParentSkill | null>(null)
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string>('csi')
  const [proficiency, setProficiency] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [searchCSI, setSearchCSI] = useState(true)
  const [searchONET, setSearchONET] = useState(false)
  const lastExternalTermRef = useRef<string | null>(null)

  // Search skills with debounce and query cancellation
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text)

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Cancel previous search if in progress
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      if (text.trim().length < 2) {
        setSearchResults([])
        setIsLoading(false)
        return
      }

      // Create new abort controller for this search
      abortControllerRef.current = new AbortController()
      const currentAbortController = abortControllerRef.current

      // Debounce the search
      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true)
        try {
          const taxonomies: string[] = []
          if (searchCSI) taxonomies.push('csi')
          if (searchONET) taxonomies.push('onet')

          const results = await onSearchSkills(text, taxonomies)

          // Only update if not aborted
          if (!currentAbortController.signal.aborted) {
            setSearchResults(results)
            setIsLoading(false)
          }
        } catch (error) {
          // Only update error if not aborted
          if (!currentAbortController.signal.aborted) {
            console.error('Search error:', error)
            setSearchResults([])
            setIsLoading(false)
          }
        }
      }, 300)
    },
    [onSearchSkills, searchCSI, searchONET],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

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

    setSearchQuery(externalSearchTerm)
    handleSearchChange(externalSearchTerm)
    onConsumeExternalSearchTerm?.()
  }, [
    externalSearchTerm,
    externalSearchTaxonomy,
    handleSearchChange,
    onConsumeExternalSearchTerm,
  ])

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
      // Remove added skill from search results, keep query and other results
      setSearchResults((prev) =>
        prev.filter((skill) => skill.id !== selectedSkill.id)
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

      {/* Search Input */}
      <XStack gap="$2" items="center">
        <Input
          flex={1}
          placeholder="Search for a skill (e.g., Concrete, Plumbing)..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          size="$4"
        />
        {(isLoading || isSearching) && <Spinner size="small" />}
      </XStack>

      {/* Search Results */}
      <YStack gap="$2" minH={200}>
        {searchResults.length === 0 && searchQuery.trim().length >= 2 && !isLoading && (
          <YStack p="$4" items="center" gap="$2">
            <Text color="$color11">No skills found</Text>
            <Text fontSize="$2" color="$color11" text="center">
              Try a different search term or enable more taxonomies
            </Text>
          </YStack>
        )}

        {searchResults.length === 0 && searchQuery.trim().length < 2 && (
          <YStack p="$4" items="center" gap="$2">
            <Search size={32} color="$color11" />
            <Text color="$color11">Start typing to search</Text>
            <Text fontSize="$2" color="$color11" text="center">
              Search for skills like "Concrete" or "Electrical"
            </Text>
          </YStack>
        )}

        {searchResults.map((skill) => {
          const isExisting = existingSkillIds.includes(skill.id)
          // Determine taxonomy from skill code (CSI codes are numeric, O*NET have dashes)
          const taxonomy = skill.code.includes('-') ? 'onet' : 'csi'
          return (
            <Card
              key={skill.id}
              size="$4"
              bordered
              borderColor={isExisting ? '$blue9' : undefined}
              borderWidth={isExisting ? 2 : 1}
              pressStyle={{ scale: 0.98, backgroundColor: '$color5' }}
              animation="quick"
              onPress={() => handleSkillSelect(skill, taxonomy)}
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
        })}
      </YStack>
    </YStack>
  )
}
