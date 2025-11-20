import { useState, useMemo } from 'react'
import { YStack, XStack, Text, Button, Label } from 'tamagui'
import { Popover } from '@app/ui'
import { SlidersHorizontal, ChevronDown } from '@tamagui/lucide-icons'
import { ToggleSwitch } from '@app/ui'

type FilterDropdownProps = {
  showWorkers?: boolean
  showOrganizations?: boolean
  showJobs?: boolean
  onShowWorkersChange?: (value: boolean) => void
  onShowOrganizationsChange?: (value: boolean) => void
  onShowJobsChange?: (value: boolean) => void
}

/**
 * Filter Dropdown Component
 *
 * A dropdown menu for toggling visibility of Workers, Organizations, and Jobs on the map.
 * Shows active filter count in the button label.
 *
 * Features:
 * - Toggle visibility of Workers, Employers, and Jobs on the map
 * - Dynamic button label showing active filter count
 * - Uses Popover for dropdown functionality
 * - Full accessibility support with ARIA labels
 */
export const FilterDropdown = ({
  showWorkers = true,
  showOrganizations = true,
  showJobs = true,
  onShowWorkersChange,
  onShowOrganizationsChange,
  onShowJobsChange,
}: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate how many filter types are currently active
  const activeFilterCount = useMemo(() => {
    return [showWorkers, showOrganizations, showJobs].filter(Boolean).length
  }, [showWorkers, showOrganizations, showJobs])

  /**
   * Generate button label text with active filter indicators
   * Shows "All" if all active, "None" if none active, or count
   */
  const getButtonLabel = () => {
    if (activeFilterCount === 0) return 'Filters (None)'
    if (activeFilterCount === 3) return 'Filters (All)'
    return `Filters (${activeFilterCount})`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} placement="bottom-start">
      <Popover.Trigger asChild>
        <Button
          size="$4"
          variant="outlined"
          bg={activeFilterCount < 3 ? '$blue9' : '$background'}
          color={activeFilterCount < 3 ? 'white' : '$color'}
          hoverStyle={{ bg: activeFilterCount < 3 ? '$blue10' : '$backgroundHover' }}
          pressStyle={{ bg: activeFilterCount < 3 ? '$blue11' : '$backgroundPress' }}
          icon={SlidersHorizontal}
          iconAfter={ChevronDown}
          scaleIcon={1.2}
        >
          {getButtonLabel()}
        </Button>
      </Popover.Trigger>

      <Popover.Content
        rounded="$4"
        p="$3"
        borderWidth={1}
        borderColor="$borderColor"
        bg="$background"
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.15}
        shadowRadius={12}
        style={{ minWidth: 280, maxWidth: 320 }}
        animation="quick"
        enterStyle={{ opacity: 0, scale: 0.95, y: -10 }}
        exitStyle={{ opacity: 0, scale: 0.95, y: -10 }}
      >
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="700" mb="$1">
            Display on Map
          </Text>

          {/* Workers Toggle */}
          <YStack gap="$1">
            <XStack justify="space-between" items="center">
              <Label fontSize="$4" onPress={() => onShowWorkersChange?.(!showWorkers)}>
                Workers
              </Label>
              <ToggleSwitch
                checked={showWorkers}
                onCheckedChange={(checked) => onShowWorkersChange?.(checked)}
                aria-label={showWorkers ? 'Showing workers on map' : 'Hiding workers on map'}
              />
            </XStack>
            <Text fontSize="$2" color="$color10" pl="$1">
              Show worker profiles on the map
            </Text>
          </YStack>

          {/* Employers Toggle */}
          <YStack gap="$1">
            <XStack justify="space-between" items="center">
              <Label fontSize="$4" onPress={() => onShowOrganizationsChange?.(!showOrganizations)}>
                Employers
              </Label>
              <ToggleSwitch
                checked={showOrganizations}
                onCheckedChange={(checked) => onShowOrganizationsChange?.(checked)}
                aria-label={
                  showOrganizations ? 'Showing employers on map' : 'Hiding employers on map'
                }
              />
            </XStack>
            <Text fontSize="$2" color="$color10" pl="$1">
              Show employer organizations on the map
            </Text>
          </YStack>

          {/* Jobs Toggle */}
          <YStack gap="$1">
            <XStack justify="space-between" items="center">
              <Label fontSize="$4" onPress={() => onShowJobsChange?.(!showJobs)}>
                Jobs
              </Label>
              <ToggleSwitch
                checked={showJobs}
                onCheckedChange={(checked) => onShowJobsChange?.(checked)}
                aria-label={showJobs ? 'Showing jobs on map' : 'Hiding jobs on map'}
              />
            </XStack>
            <Text fontSize="$2" color="$color10" pl="$1">
              Show job openings on the map
            </Text>
          </YStack>
        </YStack>
      </Popover.Content>
    </Popover>
  )
}

