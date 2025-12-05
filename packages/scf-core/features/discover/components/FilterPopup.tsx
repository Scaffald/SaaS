import { ToggleSwitch } from '@unicornlove/ui'
import { ChevronDown, ChevronRight, X } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { AnimatePresence, Button, Label, ScrollView, Text, XStack, YStack } from '@unicornlove/ui'

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

  return (
    <AnimatePresence>
      {isOpen && (
        <XStack
          position="absolute"
          bottom={100}
          left={0}
          right={railVisible ? 440 : 0}
          zIndex={60}
          animation="quick"
          enterStyle={{ opacity: 0, y: 20 }}
          exitStyle={{ opacity: 0, y: 20 }}
          opacity={1}
          y={0}
          justifyContent="center"
          alignItems="center"
          paddingHorizontal="$4"
        >
          <YStack
            width={300}
            height={250}
            flex={1}
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$background"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.15}
            shadowRadius={12}
            borderRadius="$4"
            overflow="hidden"
          >
            {/* Header */}
            <XStack
              paddingHorizontal="$4"
              paddingVertical="$3"
              justifyContent="space-between"
              alignItems="center"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
            >
              <Text fontSize="$5" fontWeight="700">
                Filters
              </Text>
              <Button
                size="$2"
                circular
                variant="outlined"
                onPress={onClose}
                icon={X}
                scaleIcon={1.2}
              />
            </XStack>

            {/* Scrollable Content */}
            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
              <YStack padding="$3" gap="$2">
                {/* Show Section */}
                <YStack>
                  <Button
                    unstyled
                    onPress={() => toggleSection('show')}
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    hoverStyle={{ backgroundColor: '$color3' }}
                    pressStyle={{ backgroundColor: '$color4' }}
                    borderRadius="$3"
                  >
                    <XStack justifyContent="space-between" alignItems="center" flex={1}>
                      <Text fontSize="$4" fontWeight="600">
                        {getSectionHeaderText()}
                      </Text>
                      {openSections.has('show') ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </XStack>
                  </Button>

                  {openSections.has('show') && (
                    <YStack gap="$3" paddingHorizontal="$3" paddingVertical="$3">
                      {/* Workers Toggle */}
                      <YStack gap="$1">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Label fontSize="$3" onPress={() => onShowWorkersChange?.(!showWorkers)}>
                            Workers
                          </Label>
                          <ToggleSwitch
                            checked={showWorkers}
                            onCheckedChange={(checked) => onShowWorkersChange?.(checked)}
                            aria-label={
                              showWorkers ? 'Showing workers on map' : 'Hiding workers on map'
                            }
                          />
                        </XStack>
                        <Text fontSize="$1" color="$color10" paddingLeft="$1">
                          Show worker profiles on the map
                        </Text>
                      </YStack>

                      {/* Employers Toggle */}
                      <YStack gap="$1">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Label
                            fontSize="$3"
                            onPress={() => onShowOrganizationsChange?.(!showOrganizations)}
                          >
                            Employers
                          </Label>
                          <ToggleSwitch
                            checked={showOrganizations}
                            onCheckedChange={(checked) => onShowOrganizationsChange?.(checked)}
                            aria-label={
                              showOrganizations
                                ? 'Showing employers on map'
                                : 'Hiding employers on map'
                            }
                          />
                        </XStack>
                        <Text fontSize="$1" color="$color10" paddingLeft="$1">
                          Show employer organizations on the map
                        </Text>
                      </YStack>

                      {/* Jobs Toggle */}
                      <YStack gap="$1">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Label fontSize="$3" onPress={() => onShowJobsChange?.(!showJobs)}>
                            Jobs
                          </Label>
                          <ToggleSwitch
                            checked={showJobs}
                            onCheckedChange={(checked) => onShowJobsChange?.(checked)}
                            aria-label={showJobs ? 'Showing jobs on map' : 'Hiding jobs on map'}
                          />
                        </XStack>
                        <Text fontSize="$1" color="$color10" paddingLeft="$1">
                          Show job openings on the map
                        </Text>
                      </YStack>
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </ScrollView>

            {/* Footer */}
            <XStack
              paddingHorizontal="$4"
              paddingVertical="$3"
              gap="$2"
              justifyContent="flex-end"
              borderTopWidth={1}
              borderTopColor="$borderColor"
            >
              <Button size="$3" variant="outlined" onPress={onClose}>
                <Text>Close</Text>
              </Button>
              <Button size="$3" onPress={onClose}>
                <Text>Apply</Text>
              </Button>
            </XStack>
          </YStack>
        </XStack>
      )}
    </AnimatePresence>
  )
}
