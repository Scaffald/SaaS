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
      <Stack flex={1} align="center" justify="center" padding="md">
        <Spinner size="lg" color="$blue10" />
        <Text marginTop={8} color="$gray11">
          Loading filters...
        </Text>
      </Stack>
    )
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <Stack gap={16} padding="md">
        {/* Search */}
        <DashboardWidget>
          <Stack gap={12}>
            <Row align="center" justify="space-between">
              <Text color="$gray11">Search Jobs</Text>
              <Search size="lg" color="$gray11" />
            </Row>

            <Input
              placeholder="Search by title, company..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              size="md"
            />
          </Stack>
        </DashboardWidget>

        {/* Filters Header */}
        <DashboardWidget>
          <Row align="center" justify="space-between">
            <Row align="center" gap={8}>
              <Filter size="lg" color="$gray11" />
              <Text color="$gray11">Filters</Text>
            </Row>

            {hasActiveFilters && (
              <Button size="xs" variant="outline" onPress={clearAllFilters} icon={X}>
                Clear
              </Button>
            )}
          </Row>
        </DashboardWidget>

        {/* Job Source Filter */}
        <DashboardWidget>
          <Stack gap={12}>
            <Text color="$gray11">Job Source</Text>

            <Stack gap={8}>
              <Button
                size="sm"
                variant="outline"
                theme={jobSource === 'all' ? 'blue' : undefined}
                onPress={() => onJobSourceChange('all')}
              >
                All Jobs
              </Button>
              <Button
                size="sm"
                variant="outline"
                theme={jobSource === 'internal' ? 'blue' : undefined}
                onPress={() => onJobSourceChange('internal')}
              >
                Internal Jobs (Scaffald)
              </Button>
              <Button
                size="sm"
                variant="outline"
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
            <Stack gap={12}>
              <Text color="$gray11">Industry ({INDUSTRIES.length})</Text>

              <Stack gap={8}>
                {INDUSTRIES.map((industry: string) => {
                  const isSelected = selectedIndustries.includes(industry)
                  return (
                    <Button
                      key={industry}
                      size="sm"
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
            <Stack gap={12}>
              <Text color="$gray11">Job Type ({JOB_TYPES.length})</Text>

              <Stack gap={8}>
                {JOB_TYPES.map((type: string) => {
                  const isSelected = selectedJobTypes.includes(type)
                  return (
                    <Button
                      key={type}
                      size="sm"
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
            <Stack gap={12}>
              <Row align="center" justify="space-between">
                <Text color="$gray11">Soft Skills Match</Text>
                {minSoftSkillsMatch !== null && (
                  <Button
                    size="xs"
                    variant="outline"
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
            <Stack gap={12}>
              <Row align="center" gap={8}>
                <ChevronsUpDown size={18} color="$gray11" />
                <Text color="$gray11">Sort By</Text>
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
            <Stack gap={8}>
              <Text color="$gray11">Active Filters</Text>

              {searchQuery && (
                <Row align="center" gap={8}>
                  <Text color="$gray11">Search:</Text>
                  <Text color="$blue11">"{searchQuery}"</Text>
                </Row>
              )}

              {selectedIndustries.length > 0 && (
                <Row align="center" gap={8}>
                  <Text color="$gray11">Industries:</Text>
                  <Text color="$blue11">{selectedIndustries.length}</Text>
                </Row>
              )}

              {selectedJobTypes.length > 0 && (
                <Row align="center" gap={8}>
                  <Text color="$gray11">Job Types:</Text>
                  <Text color="$blue11">{selectedJobTypes.length}</Text>
                </Row>
              )}

              {minSoftSkillsMatch !== null && (
                <Row align="center" gap={8}>
                  <Text color="$gray11">Min Match:</Text>
                  <Text color="$blue11">{minSoftSkillsMatch}%</Text>
                </Row>
              )}

              {sortBy !== 'relevance' && (
                <Row align="center" gap={8}>
                  <Text color="$gray11">Sort:</Text>
                  <Text color="$blue11">{sortBy === 'match_score' ? 'Best Match' : sortBy}</Text>
                </Row>
              )}
            </Stack>
          </DashboardWidget>
        )}
      </Stack>
    </ScrollView>
  )
}
