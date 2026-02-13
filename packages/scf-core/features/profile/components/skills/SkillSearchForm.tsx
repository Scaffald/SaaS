import { CustomCheckbox } from '@unicornlove/beyond-ui'
import { useCallback } from 'react'
import { Label, Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { ParentSkill } from '../../types/profile-skills-types'
import { SimpleSkillAutocomplete } from './SimpleSkillAutocomplete'

interface SkillSearchFormProps {
  /** Current search input value */
  searchInputValue: string
  /** Callback when search input changes */
  onInputChange: (value: string) => void
  /** Whether CSI taxonomy is enabled */
  searchCSI: boolean
  /** Callback when CSI checkbox changes */
  onSearchCSIChange: (checked: boolean) => void
  /** Whether O*NET taxonomy is enabled */
  searchONET: boolean
  /** Callback when O*NET checkbox changes */
  onSearchONETChange: (checked: boolean) => void
  /** Callback to perform search */
  onSearch: (query: string) => Promise<ParentSkill[]>
  /** Callback when skill is selected */
  onSkillSelect: (skill: ParentSkill, taxonomy: string) => void
  /** Whether search is loading */
  isSearching?: boolean
  /** Existing skill IDs to filter out */
  existingSkillIds?: string[]
}

/**
 * Skill Search Form Component
 * Search input with taxonomy filters for finding skills
 */
export function SkillSearchForm({
  searchInputValue,
  onInputChange,
  searchCSI,
  onSearchCSIChange,
  searchONET,
  onSearchONETChange,
  onSearch,
  onSkillSelect,
  isSearching = false,
  existingSkillIds = [],
}: SkillSearchFormProps) {
  // Handle skill selection from SimpleSkillAutocomplete
  const handleSelect = useCallback(
    (skill: ParentSkill) => {
      // Determine taxonomy from skill code (CSI codes are numeric, O*NET have dashes)
      const taxonomy = skill.code.includes('-') ? 'onet' : 'csi'
      onSkillSelect(skill, taxonomy)
    },
    [onSkillSelect]
  )

  return (
    <Stack gap={16}>
      <Row justify="space-between" align="center">
        <Text>Search for Skills</Text>

        {/* Taxonomy Checkboxes */}
        <Row gap={12} align="center">
          <Row gap={8} align="center">
            <CustomCheckbox
              checked={searchCSI}
              onCheckedChange={onSearchCSIChange}
              aria-label="Filter CSI taxonomy"
              testID="search-csi"
            />
            <Label onPress={() => onSearchCSIChange(!searchCSI)}>CSI</Label>
          </Row>

          <Row gap={8} align="center">
            <CustomCheckbox
              checked={searchONET}
              onCheckedChange={onSearchONETChange}
              aria-label="Filter O*NET taxonomy"
              testID="search-onet"
            />
            <Label onPress={() => onSearchONETChange(!searchONET)}>O*NET</Label>
          </Row>
        </Row>
      </Row>

      {/* Simple Skill Autocomplete Component */}
      <SimpleSkillAutocomplete
        value={searchInputValue}
        onChangeText={onInputChange}
        onSearch={onSearch}
        onSelect={handleSelect}
        isLoading={isSearching}
        placeholder="Search for a skill (e.g., Concrete, Plumbing)..."
        existingSkillIds={existingSkillIds}
      />
    </Stack>
  )
}
