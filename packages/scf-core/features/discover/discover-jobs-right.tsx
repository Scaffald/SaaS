import { useFilterOptions } from '@scf/core/utils/jobs-sdk-hooks'
import { useSoftSkills } from '@scf/core/utils/profile-skills-sdk-hooks'
import { DashboardWidget, ResponsiveSelect } from '@scaffald/ui'
import { ChevronsUpDown, Filter, X } from 'lucide-react-native'
import { useState } from 'react'
import {
  Button,
  RangeSlider,
  Row,
  ScrollView,
  Skeleton,
  SkeletonBox,
  Stack,
  Text,
} from '@scaffald/ui'

interface DiscoverJobsRightProps {
  searchQuery: string
  onClearSearch: () => void
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
  searchQuery,
  onClearSearch,
  onIndustriesChange,
  onJobTypesChange,
  jobSource,
  onJobSourceChange,
  minSoftSkillsMatch,
  onMinSoftSkillsMatchChange,
  sortBy,
  onSortByChange,
}: DiscoverJobsRightProps) {
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
    onClearSearch()
    setSelectedIndustries([])
    setSelectedJobTypes([])
    onMinSoftSkillsMatchChange(null)
    onSortByChange('relevance')
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
      <Stack gap={16} padding="md">
        <SkeletonBox width="100%" height={44} borderRadius={8} />
        {[0, 1, 2].map((i) => (
          <Stack key={i} gap={8}>
            <Skeleton width={120} height={14} shape="text" />
            <SkeletonBox width="100%" height={40} borderRadius={8} />
          </Stack>
        ))}
      </Stack>
    )
  }

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      <Stack gap={16} padding="md">
        {/* Filters Header */}
        <DashboardWidget>
          <Row align="center" justify="space-between">
            <Row align="center" gap={8}>
              <Filter size={24} color="#737373" />
              <Text color="secondary">Filters</Text>
            </Row>

            {hasActiveFilters && (
              <Button size="sm" variant="outline" onPress={clearAllFilters} iconStart={X}>
                Clear
              </Button>
            )}
          </Row>
        </DashboardWidget>

        {/* Job Source Filter */}
        <DashboardWidget>
          <Stack gap={12}>
            <Text color="secondary">Job Source</Text>

            <Stack gap={8}>
              <Button
                size="sm"
                variant="outline"
                color={jobSource === 'all' ? 'primary' : 'gray'}
                onPress={() => onJobSourceChange('all')}
              >
                All Jobs
              </Button>
              <Button
                size="sm"
                variant="outline"
                color={jobSource === 'internal' ? 'primary' : 'gray'}
                onPress={() => onJobSourceChange('internal')}
              >
                Internal Jobs (Scaffald)
              </Button>
              <Button
                size="sm"
                variant="outline"
                color={jobSource === 'external' ? 'primary' : 'gray'}
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
              <Text color="secondary">Industry ({INDUSTRIES.length})</Text>

              <Stack gap={8}>
                {INDUSTRIES.map((industry: string) => {
                  const isSelected = selectedIndustries.includes(industry)
                  return (
                    <Button
                      key={industry}
                      size="sm"
                      variant="outline"
                      color={isSelected ? 'primary' : 'gray'}
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
                      variant="outline"
                      color={isSelected ? 'primary' : 'gray'}
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
                <Text color="secondary">Soft Skills Match</Text>
                {minSoftSkillsMatch !== null && (
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => onMinSoftSkillsMatchChange(null)}
                    iconStart={X}
                  >
                    Clear
                  </Button>
                )}
              </Row>

              <Stack gap={8}>
                <Text color="secondary">Minimum Match Score</Text>
                <Text color="secondary" style={{ fontSize: 12 }}>
                  Show only jobs with soft skills match above this threshold
                </Text>
                <RangeSlider
                  value={minSoftSkillsMatch ?? 0}
                  onValueChange={(value: number) => {
                    onMinSoftSkillsMatchChange(value > 0 ? value : null)
                  }}
                  min={0}
                  max={100}
                  step={5}
                />
              </Stack>
            </Stack>
          </DashboardWidget>
        )}

        {/* Sort Options */}
        {jobSource !== 'external' && (
          <DashboardWidget>
            <Stack gap={12}>
              <Row align="center" gap={8}>
                <ChevronsUpDown size={18} color="#737373" />
                <Text color="secondary">Sort By</Text>
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
              <Text color="secondary">Active Filters</Text>

              {searchQuery && (
                <Row align="center" gap={8}>
                  <Text color="secondary">Search:</Text>
                  <Text color="primary">"{searchQuery}"</Text>
                </Row>
              )}

              {selectedIndustries.length > 0 && (
                <Row align="center" gap={8}>
                  <Text color="secondary">Industries:</Text>
                  <Text color="primary">{selectedIndustries.length}</Text>
                </Row>
              )}

              {selectedJobTypes.length > 0 && (
                <Row align="center" gap={8}>
                  <Text color="secondary">Job Types:</Text>
                  <Text color="primary">{selectedJobTypes.length}</Text>
                </Row>
              )}

              {minSoftSkillsMatch !== null && (
                <Row align="center" gap={8}>
                  <Text color="secondary">Min Match:</Text>
                  <Text color="primary">{minSoftSkillsMatch}%</Text>
                </Row>
              )}

              {sortBy !== 'relevance' && (
                <Row align="center" gap={8}>
                  <Text color="secondary">Sort:</Text>
                  <Text color="primary">{sortBy === 'match_score' ? 'Best Match' : sortBy}</Text>
                </Row>
              )}
            </Stack>
          </DashboardWidget>
        )}
      </Stack>
    </ScrollView>
  )
}
