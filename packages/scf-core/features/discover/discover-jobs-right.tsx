import { useFilterOptions } from '@scf/core/utils/jobs-sdk-hooks'
import { useSoftSkills } from '@scf/core/utils/profile-skills-sdk-hooks'
import { DashboardWidget, RangeSliderCard, ResponsiveSelect } from '@unicornlove/beyond-ui'
import { ChevronsUpDown, Filter, Search, X } from 'lucide-react-native'
import { useState } from 'react'
import { Button, Input, ScrollView, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

interface DiscoverJobsRightProps {
  onSearchChange: (search: string) => void
  onIndustriesChange: (industries: string[]) => void
  onJobTypesChange: (types: string[]) => void
  jobSource: 'all' | 'internal' | 'external'
  onJobSourceChange: (source: 'all' | 'internal' | 'external') => void
  minSoftSkillsMatch: number | null
  onMinSoftSkillsMatchChange: (match: number | null) => void
  sortBy: 'relevance' | 'match_score'
  onSortByChange: (sort: 'relevance' | 'match_score') => void
}

/**
 * Discover Jobs Right Component
 * Right panel content for the jobs discovery page - filters and search
 */
export function DiscoverJobsRight({
  onSearchChange,
  onIndustriesChange,
  onJobTypesChange,
  jobSource,
  onJobSourceChange,
  minSoftSkillsMatch,
  onMinSoftSkillsMatchChange,
  sortBy,
  onSortByChange,
}: DiscoverJobsRightProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([])

  // Fetch filter options from API (SDK)
  const { data: filterData, isLoading: filtersLoading } = useFilterOptions()
  const INDUSTRIES = filterData?.industries ?? []
  const JOB_TYPES = filterData?.jobTypes ?? []

  // Check if user has soft skills assessment
  const { data: softSkillsData } = useSoftSkills(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  const hasSoftSkillsAssessment = (softSkillsData?.skills.length ?? 0) > 0

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange(value)
  }

  const toggleIndustry = (industry: string) => {
    const newSelection = selectedIndustries.includes(industry)
      ? selectedIndustries.filter((i) => i !== industry)
      : [...selectedIndustries, industry]

    setSelectedIndustries(newSelection)
    onIndustriesChange(newSelection)
  }

  const toggleJobType = (type: string) => {
    const newSelection = selectedJobTypes.includes(type)
      ? selectedJobTypes.filter((t) => t !== type)
      : [...selectedJobTypes, type]

    setSelectedJobTypes(newSelection)
    onJobTypesChange(newSelection)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedIndustries([])
    setSelectedJobTypes([])
    onMinSoftSkillsMatchChange(null)
    onSortByChange('relevance')
    onSearchChange('')
    onIndustriesChange([])
    onJobTypesChange([])
  }

  const hasActiveFilters =
    searchQuery ||
    selectedIndustries.length > 0 ||
    selectedJobTypes.length > 0 ||
    minSoftSkillsMatch !== null ||
    sortBy !== 'relevance'

  if (filtersLoading) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$2" color="$color11">
          Loading filters...
        </Text>
      </Stack>
    )
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <Stack gap="$4" padding="$4">
        {/* Search */}
        <DashboardWidget>
          <Stack gap="$3">
            <Row alignItems="center" justifyContent="space-between">
              <Text fontSize="$5" fontWeight="600" color="$color12">
                Search Jobs
              </Text>
              <Search size={20} color="$color10" />
            </Row>

            <Input
              placeholder="Search by title, company..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              size="$4"
            />
          </Stack>
        </DashboardWidget>

        {/* Filters Header */}
        <DashboardWidget>
          <Row alignItems="center" justifyContent="space-between">
            <Row alignItems="center" gap="$2">
              <Filter size={20} color="$color10" />
              <Text fontSize="$5" fontWeight="600" color="$color12">
                Filters
              </Text>
            </Row>

            {hasActiveFilters && (
              <Button size="$2" variant="outlined" onPress={clearAllFilters} icon={X}>
                Clear
              </Button>
            )}
          </Row>
        </DashboardWidget>

        {/* Job Source Filter */}
        <DashboardWidget>
          <Stack gap="$3">
            <Text fontSize="$4" fontWeight="600" color="$color12">
              Job Source
            </Text>

            <Stack gap="$2">
              <Button
                size="$3"
                variant="outlined"
                theme={jobSource === 'all' ? 'blue' : undefined}
                onPress={() => onJobSourceChange('all')}
              >
                All Jobs
              </Button>
              <Button
                size="$3"
                variant="outlined"
                theme={jobSource === 'internal' ? 'blue' : undefined}
                onPress={() => onJobSourceChange('internal')}
              >
                Internal Jobs (Scaffald)
              </Button>
              <Button
                size="$3"
                variant="outlined"
                theme={jobSource === 'external' ? 'blue' : undefined}
                onPress={() => onJobSourceChange('external')}
              >
                External Jobs
              </Button>
            </Stack>
          </Stack>
        </DashboardWidget>

        {/* Industry Filter */}
        {INDUSTRIES.length > 0 && (
          <DashboardWidget>
            <Stack gap="$3">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Industry ({INDUSTRIES.length})
              </Text>

              <Stack gap="$2">
                {INDUSTRIES.map((industry: string) => {
                  const isSelected = selectedIndustries.includes(industry)
                  return (
                    <Button
                      key={industry}
                      size="$3"
                      variant={isSelected ? 'outlined' : 'outlined'}
                      theme={isSelected ? 'blue' : undefined}
                      onPress={() => toggleIndustry(industry)}
                    >
                      {industry}
                    </Button>
                  )
                })}
              </Stack>
            </Stack>
          </DashboardWidget>
        )}

        {/* Job Type Filter */}
        {JOB_TYPES.length > 0 && (
          <DashboardWidget>
            <Stack gap="$3">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Job Type ({JOB_TYPES.length})
              </Text>

              <Stack gap="$2">
                {JOB_TYPES.map((type: string) => {
                  const isSelected = selectedJobTypes.includes(type)
                  return (
                    <Button
                      key={type}
                      size="$3"
                      variant={isSelected ? 'outlined' : 'outlined'}
                      theme={isSelected ? 'blue' : undefined}
                      onPress={() => toggleJobType(type)}
                    >
                      {type}
                    </Button>
                  )
                })}
              </Stack>
            </Stack>
          </DashboardWidget>
        )}

        {/* Soft Skills Match Filter - Only for internal jobs */}
        {hasSoftSkillsAssessment && jobSource !== 'external' && (
          <DashboardWidget>
            <Stack gap="$3">
              <Row alignItems="center" justifyContent="space-between">
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  Soft Skills Match
                </Text>
                {minSoftSkillsMatch !== null && (
                  <Button
                    size="$2"
                    variant="outlined"
                    onPress={() => onMinSoftSkillsMatchChange(null)}
                    icon={X}
                  >
                    Clear
                  </Button>
                )}
              </Row>

              <RangeSliderCard
                title="Minimum Match Score"
                description="Show only jobs with soft skills match above this threshold"
                value={minSoftSkillsMatch ?? 0}
                onValueChange={(value) => {
                  onMinSoftSkillsMatchChange(value > 0 ? value : null)
                }}
                min={0}
                max={100}
                step={5}
                formatValue={(v) => `${v}%`}
                formatMin={() => '0%'}
                formatMax={() => '100%'}
              />
            </Stack>
          </DashboardWidget>
        )}

        {/* Sort Options */}
        {jobSource !== 'external' && (
          <DashboardWidget>
            <Stack gap="$3">
              <Row alignItems="center" gap="$2">
                <ChevronsUpDown size={18} color="$color10" />
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  Sort By
                </Text>
              </Row>

              <ResponsiveSelect
                value={sortBy}
                onValueChange={(value) => {
                  onSortByChange(value as 'relevance' | 'match_score')
                }}
                options={[
                  { value: 'relevance', label: 'Relevance' },
                  {
                    value: 'match_score',
                    label: 'Best Soft Skills Match',
                    disabled: !hasSoftSkillsAssessment,
                  },
                ]}
                placeholder="Sort jobs by..."
                label="Sort"
              />
            </Stack>
          </DashboardWidget>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <DashboardWidget>
            <Stack gap="$2">
              <Text fontSize="$4" fontWeight="600" color="$color12">
                Active Filters
              </Text>

              {searchQuery && (
                <Row alignItems="center" gap="$2">
                  <Text fontSize="$3" color="$color11">
                    Search:
                  </Text>
                  <Text fontSize="$3" color="$blue11" fontWeight="600">
                    "{searchQuery}"
                  </Text>
                </Row>
              )}

              {selectedIndustries.length > 0 && (
                <Row alignItems="center" gap="$2">
                  <Text fontSize="$3" color="$color11">
                    Industries:
                  </Text>
                  <Text fontSize="$3" color="$blue11" fontWeight="600">
                    {selectedIndustries.length}
                  </Text>
                </Row>
              )}

              {selectedJobTypes.length > 0 && (
                <Row alignItems="center" gap="$2">
                  <Text fontSize="$3" color="$color11">
                    Job Types:
                  </Text>
                  <Text fontSize="$3" color="$blue11" fontWeight="600">
                    {selectedJobTypes.length}
                  </Text>
                </Row>
              )}

              {minSoftSkillsMatch !== null && (
                <Row alignItems="center" gap="$2">
                  <Text fontSize="$3" color="$color11">
                    Min Match:
                  </Text>
                  <Text fontSize="$3" color="$blue11" fontWeight="600">
                    {minSoftSkillsMatch}%
                  </Text>
                </Row>
              )}

              {sortBy !== 'relevance' && (
                <Row alignItems="center" gap="$2">
                  <Text fontSize="$3" color="$color11">
                    Sort:
                  </Text>
                  <Text fontSize="$3" color="$blue11" fontWeight="600">
                    {sortBy === 'match_score' ? 'Best Match' : sortBy}
                  </Text>
                </Row>
              )}
            </Stack>
          </DashboardWidget>
        )}
      </Stack>
    </ScrollView>
  )
}
