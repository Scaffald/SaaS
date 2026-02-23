import { Switch } from '@scaffald/ui'
import { ChevronDown, ChevronRight, X } from 'lucide-react-native'
import { useState } from 'react'
import { Button, Label, ScrollView, Text, Row, Stack } from '@scaffald/ui'

type FilterPopupProps = {
  isOpen: boolean
  onClose: () => void
  railVisible?: boolean
  showWorkers?: boolean
  showOrganizations?: boolean
  showJobs?: boolean
  onShowWorkersChange?: (value: boolean) => void
  onShowOrganizationsChange?: (value: boolean) => void
  onShowJobsChange?: (value: boolean) => void
}

type AccordionSection = 'show'

/**
 * Filter Popup Component
 *
 * A 300px wide x 250px high popup that appears above the filter bar with
 * accordion sections for controlling what appears on the map.
 *
 * Features:
 * - Toggle visibility of Workers, Employers, and Jobs on the map
 * - Dynamic section header showing active filter count
 * - Descriptive helper text for each toggle option
 * - Full accessibility support with ARIA labels
 * - Smooth animations when opening/closing
 *
 * @example
 * ```tsx
 * <FilterPopup
 *   isOpen={filtersOpen}
 *   onClose={() => setFiltersOpen(false)}
 *   showWorkers={showWorkers}
 *   showOrganizations={showOrganizations}
 *   showJobs={showJobs}
 *   onShowWorkersChange={setShowWorkers}
 *   onShowOrganizationsChange={setShowOrganizations}
 *   onShowJobsChange={setShowJobs}
 * />
 * ```
 */
export const FilterPopup = ({
  isOpen,
  onClose,
  railVisible = false,
  showWorkers = true,
  showOrganizations = true,
  showJobs = true,
  onShowWorkersChange,
  onShowOrganizationsChange,
  onShowJobsChange,
}: FilterPopupProps) => {
  // Track which accordion sections are expanded (currently only 'show' section exists)
  const [openSections, setOpenSections] = useState<Set<AccordionSection>>(new Set(['show']))

  const toggleSection = (section: AccordionSection) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  // Calculate how many filter types are currently active
  const activeFilterCount = [showWorkers, showOrganizations, showJobs].filter(Boolean).length

  /**
   * Generate section header text with active filter indicators
   * Shows "None" if no filters active, "All" if all active, or lists active filters
   */
  const getSectionHeaderText = () => {
    if (activeFilterCount === 0) return 'Display on Map (None)'
    if (activeFilterCount === 3) return 'Display on Map (All)'
    const activeFilters: string[] = []
    if (showWorkers) activeFilters.push('Workers')
    if (showOrganizations) activeFilters.push('Employers')
    if (showJobs) activeFilters.push('Jobs')
    return `Display on Map (${activeFilters.join(', ')})`
  }

  if (!isOpen) return null

  return (
    <Row
      justify="center"
      align="center"
      paddingHorizontal={16}
      style={{
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: railVisible ? 440 : 0,
        zIndex: 60,
      }}
    >
      <Stack
        width={300}
        height={250}
        flex={1}
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$background"
        borderRadius={16}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          overflow: 'hidden',
        }}
      >
            {/* Header */}
            <Row
              paddingHorizontal={16}
              paddingVertical={12}
              justify="space-between"
              align="center"
              style={{ borderBottomWidth: 1, borderBottomColor: '$borderColor' }}
            >
              <Text>Filters</Text>
              <Button size="sm" variant="outline" onPress={onClose} iconStart={X} />
            </Row>

            {/* Scrollable Content */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <Stack padding="sm" gap={8}>
                {/* Show Section */}
                <Stack>
                  <Button
                    variant="text"
                    onPress={() => toggleSection('show')}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                    }}
                  >
                    <Row justify="space-between" align="center" flex={1}>
                      <Text>{getSectionHeaderText()}</Text>
                      {openSections.has('show') ? (
                        <ChevronDown size="md" />
                      ) : (
                        <ChevronRight size="md" />
                      )}
                    </Row>
                  </Button>

                  {openSections.has('show') && (
                    <Stack gap={12} paddingHorizontal={12} paddingVertical={12}>
                      {/* Workers Toggle */}
                      <Stack gap={4}>
                        <Row justify="space-between" align="center">
                          <Label onPress={() => onShowWorkersChange?.(!showWorkers)}>Workers</Label>
                          <Switch
                            checked={showWorkers}
                            onChange={(checked) => onShowWorkersChange?.(checked)}
                            accessibilityLabel={
                              showWorkers ? 'Showing workers on map' : 'Hiding workers on map'
                            }
                          />
                        </Row>
                        <Text color="$gray11" style={{ paddingLeft: 4 }}>
                          Show worker profiles on the map
                        </Text>
                      </Stack>

                      {/* Employers Toggle */}
                      <Stack gap={4}>
                        <Row justify="space-between" align="center">
                          <Label onPress={() => onShowOrganizationsChange?.(!showOrganizations)}>
                            Employers
                          </Label>
                          <Switch
                            checked={showOrganizations}
                            onChange={(checked) => onShowOrganizationsChange?.(checked)}
                            accessibilityLabel={
                              showOrganizations
                                ? 'Showing employers on map'
                                : 'Hiding employers on map'
                            }
                          />
                        </Row>
                        <Text color="$gray11" style={{ paddingLeft: 4 }}>
                          Show employer organizations on the map
                        </Text>
                      </Stack>

                      {/* Jobs Toggle */}
                      <Stack gap={4}>
                        <Row justify="space-between" align="center">
                          <Label onPress={() => onShowJobsChange?.(!showJobs)}>Jobs</Label>
                          <Switch
                            checked={showJobs}
                            onChange={(checked) => onShowJobsChange?.(checked)}
                            accessibilityLabel={showJobs ? 'Showing jobs on map' : 'Hiding jobs on map'}
                          />
                        </Row>
                        <Text color="$gray11" style={{ paddingLeft: 4 }}>
                          Show job openings on the map
                        </Text>
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </ScrollView>

            {/* Footer */}
            <Row
              paddingHorizontal={16}
              paddingVertical={12}
              gap={8}
              justify="flex-end"
              style={{ borderTopWidth: 1, borderTopColor: '$borderColor' }}
            >
              <Button size="sm" variant="outline" onPress={onClose}>
                <Text>Close</Text>
              </Button>
              <Button size="sm" onPress={onClose}>
                <Text>Apply</Text>
              </Button>
            </Row>
          </Stack>
        </Row>
  )
}
