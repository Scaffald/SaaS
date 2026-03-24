import { useMemo, useState } from 'react'
import { Pressable } from 'react-native'
import { Stack, Text, useResponsive, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Check } from 'lucide-react-native'
import { useDebounce } from '@scf/core/utils/useDebounce'
import { PageHeader } from '@scf/core/components/PageHeader'
import type { FilterPillConfig } from '@scf/core/components/PageHeader'
import { SortDropdown } from './components/SortDropdown'
import { JobsBottomToolbar } from './components/JobsBottomToolbar'
import type { JobSortBy, JobSource } from './components/JobsBottomToolbar'
import { DiscoverJobsLeft } from './discover-jobs-left'
import { DiscoverJobsRight } from './discover-jobs-right'

/**
 * Discover Jobs Screen Component
 *
 * Search/filter/sort state lives here as the single source of truth.
 *   - Desktop+: PageHeader with search + filter pills (header)
 *   - Mobile: BottomToolbar with Sheets/ActionSheet (footer)
 */
export function DiscoverJobsScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([])
  const [jobSource, setJobSource] = useState<JobSource>('all')
  const [minSoftSkillsMatch, setMinSoftSkillsMatch] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<JobSortBy>('relevance')

  const { isMobile } = useResponsive()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const handleReset = () => {
    setSearchQuery('')
    setSelectedIndustries([])
    setSelectedJobTypes([])
    setJobSource('all')
    setMinSoftSkillsMatch(null)
    setSortBy('relevance')
  }

  const hasFilters =
    searchQuery.length > 0 ||
    selectedIndustries.length > 0 ||
    selectedJobTypes.length > 0 ||
    jobSource !== 'all' ||
    (minSoftSkillsMatch !== null && minSoftSkillsMatch > 0) ||
    sortBy !== 'relevance'

  // Source pill popover content (desktop)
  const SOURCE_OPTIONS: { value: JobSource; label: string }[] = [
    { value: 'all', label: 'All Jobs' },
    { value: 'internal', label: 'Internal Jobs (Scaffald)' },
    { value: 'external', label: 'External Jobs' },
  ]

  const sourcePopoverContent = useMemo(
    () => (
      <Stack gap={4} style={{ minWidth: 200, padding: 8 }}>
        <Text style={{ fontSize: 13, color: colors.text[t].secondary, paddingHorizontal: 8, paddingBottom: 4 }}>
          Job Source
        </Text>
        {SOURCE_OPTIONS.map((option) => {
          const isSelected = option.value === jobSource
          return (
            <Pressable
              key={option.value}
              onPress={() => setJobSource(option.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderRadius: 6,
                backgroundColor: isSelected ? colors.bg[t].muted : 'transparent',
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={{ color: isSelected ? colors.text[t].primary : colors.text[t].secondary }}>
                {option.label}
              </Text>
              {isSelected ? <Check size={16} color={colors.fg[t].active} /> : null}
            </Pressable>
          )
        })}
      </Stack>
    ),
    [jobSource, t]
  )

  // Filter pills for desktop header
  const filterPills = useMemo<FilterPillConfig[]>(() => {
    const pills: FilterPillConfig[] = []

    pills.push({
      id: 'source',
      label: 'Source',
      value: jobSource !== 'all' ? (jobSource === 'internal' ? 'Internal' : 'External') : undefined,
      isActive: jobSource !== 'all',
      onPress: () => {},
      popoverContent: sourcePopoverContent,
    })

    if (selectedJobTypes.length > 0) {
      pills.push({
        id: 'jobType',
        label: 'Job Type',
        value: selectedJobTypes.length === 1
          ? selectedJobTypes[0]
          : `${selectedJobTypes.length} selected`,
        isActive: true,
        onPress: () => {},
      })
    }

    return pills
  }, [jobSource, selectedJobTypes, sourcePopoverContent])

  // Header — desktop+ only
  const header = isMobile ? null : (
    <PageHeader
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search jobs by title, company..."
      searchVariant="pill"
      filterPills={filterPills}
      onReset={hasFilters ? handleReset : undefined}
    >
      {jobSource !== 'external' && (
        <SortDropdown
          value={sortBy}
          onChange={(v) => setSortBy(v as JobSortBy)}
          options={[
            { value: 'relevance', label: 'Relevance' },
            { value: 'match_score', label: 'Best Match' },
          ]}
        />
      )}
    </PageHeader>
  )

  // Footer — mobile only
  const footer = isMobile ? (
    <JobsBottomToolbar
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      selectedJobTypes={selectedJobTypes}
      onJobTypesChange={setSelectedJobTypes}
      jobSource={jobSource}
      onJobSourceChange={setJobSource}
      minSoftSkillsMatch={minSoftSkillsMatch}
      onMinSoftSkillsMatchChange={setMinSoftSkillsMatch}
      sortBy={sortBy}
      onSortChange={setSortBy}
      hasFilters={hasFilters}
      onReset={handleReset}
    />
  ) : null

  return {
    header,
    left: (
      <DiscoverJobsLeft
        searchQuery={debouncedSearch}
        selectedIndustries={selectedIndustries}
        selectedJobTypes={selectedJobTypes}
        jobSource={jobSource}
        minSoftSkillsMatch={minSoftSkillsMatch}
        sortBy={sortBy}
      />
    ),
    right: (
      <DiscoverJobsRight
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery('')}
        onIndustriesChange={setSelectedIndustries}
        onJobTypesChange={setSelectedJobTypes}
        jobSource={jobSource}
        minSoftSkillsMatch={minSoftSkillsMatch}
        onMinSoftSkillsMatchChange={setMinSoftSkillsMatch}
      />
    ),
    footer,
  }
}
