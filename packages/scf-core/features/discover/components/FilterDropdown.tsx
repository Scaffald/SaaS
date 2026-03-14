import { Popover, Switch } from '@scaffald/ui'
import { ChevronDown, SlidersHorizontal } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Button, Label, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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

  const popoverContent = (
    <Stack gap={12} style={{ minWidth: 280, maxWidth: 320, padding: 12 }}>
      <Text style={{ marginBottom: 4 }}>Display on Map</Text>

        {/* Workers Toggle */}
        <Stack gap={4}>
          <Row justify="space-between" align="center">
            <Label onPress={() => onShowWorkersChange?.(!showWorkers)}>Workers</Label>
            <Switch
              checked={showWorkers}
              onChange={(checked) => onShowWorkersChange?.(checked)}
              accessibilityLabel={showWorkers ? 'Showing workers on map' : 'Hiding workers on map'}
            />
          </Row>
          <Text style={{ paddingLeft: 4, color: colors.text[t].secondary }}>
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
                showOrganizations ? 'Showing employers on map' : 'Hiding employers on map'
              }
            />
          </Row>
          <Text style={{ paddingLeft: 4, color: colors.text[t].secondary }}>
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
          <Text style={{ paddingLeft: 4, color: colors.text[t].secondary }}>
            Show job openings on the map
          </Text>
        </Stack>
      </Stack>
  )

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom-start"
      content={popoverContent}
    >
      <Button
        size="md"
        variant="outline"
        color={activeFilterCount < 3 ? 'primary' : 'gray'}
        iconStart={SlidersHorizontal}
        iconEnd={ChevronDown}
      >
        {getButtonLabel()}
      </Button>
    </Popover>
  )
}
