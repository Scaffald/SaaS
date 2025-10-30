import { useState } from 'react'
import { YStack, XStack, Text, Button, ScrollView, AnimatePresence, Switch, Label } from 'tamagui'
import { ChevronDown, ChevronRight, X } from '@tamagui/lucide-icons'

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
 * 300px wide x 250px high popup with accordion sections for filters
 * Animates in above the filter bar, similar to search input
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

  return (
    <AnimatePresence>
      {isOpen && (
        <XStack
          position="absolute"
          b={100}
          l={0}
          r={railVisible ? 440 : 0}
          z={60}
          animation="quick"
          enterStyle={{ opacity: 0, y: 20 }}
          exitStyle={{ opacity: 0, y: 20 }}
          opacity={1}
          y={0}
          justify="center"
          items="center"
          px="$4"
        >
          <YStack
            width={300}
            height={250}
            flex={1}
            borderWidth={1}
            borderColor="$borderColor"
            bg="$background"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 4 }}
            shadowOpacity={0.15}
            shadowRadius={12}
            rounded="$4"
            overflow="hidden"
          >
            {/* Header */}
            <XStack
              px="$4"
              py="$3"
              justify="space-between"
              items="center"
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
              <YStack p="$3" gap="$2">
                {/* Show Section */}
                <YStack>
                  <Button
                    unstyled
                    onPress={() => toggleSection('show')}
                    px="$3"
                    py="$2"
                    hoverStyle={{ bg: '$color3' }}
                    pressStyle={{ bg: '$color4' }}
                    rounded="$3"
                  >
                    <XStack justify="space-between" items="center" flex={1}>
                      <Text fontSize="$4" fontWeight="600">
                        Show
                      </Text>
                      {openSections.has('show') ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </XStack>
                  </Button>

                  {openSections.has('show') && (
                    <YStack gap="$3" px="$3" py="$3">
                      {/* Workers Toggle */}
                      <XStack justify="space-between" items="center">
                        <Label htmlFor="workers-toggle" fontSize="$3">
                          Workers
                        </Label>
                        <Switch
                          id="workers-toggle"
                          size="$3"
                          checked={showWorkers}
                          onCheckedChange={onShowWorkersChange}
                        >
                          <Switch.Thumb animation="quick" />
                        </Switch>
                      </XStack>

                      {/* Organizations Toggle */}
                      <XStack justify="space-between" items="center">
                        <Label htmlFor="organizations-toggle" fontSize="$3">
                          Organizations
                        </Label>
                        <Switch
                          id="organizations-toggle"
                          size="$3"
                          checked={showOrganizations}
                          onCheckedChange={onShowOrganizationsChange}
                        >
                          <Switch.Thumb animation="quick" />
                        </Switch>
                      </XStack>

                      {/* Jobs Toggle */}
                      <XStack justify="space-between" items="center">
                        <Label htmlFor="jobs-toggle" fontSize="$3">
                          Jobs
                        </Label>
                        <Switch
                          id="jobs-toggle"
                          size="$3"
                          checked={showJobs}
                          onCheckedChange={onShowJobsChange}
                        >
                          <Switch.Thumb animation="quick" />
                        </Switch>
                      </XStack>
                    </YStack>
                  )}
                </YStack>
              </YStack>
            </ScrollView>

            {/* Footer */}
            <XStack
              px="$4"
              py="$3"
              gap="$2"
              justify="flex-end"
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
