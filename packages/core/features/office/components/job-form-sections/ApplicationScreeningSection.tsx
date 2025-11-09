import { useState } from 'react'
import { YStack, XStack, Text, Input, ToggleSwitch } from '@app/ui'
import { Adapt, Sheet, Select, Label } from 'tamagui'
import { Check, ChevronDown } from '@tamagui/lucide-icons'

interface ApplicationScreeningSectionProps {
  requireCurrentLocation: boolean
  requireRelocationWillingness: boolean
  minimumYearsExperience?: number
  requireWorkAuthorization: boolean
  requireEarliestStartDate: boolean
  onUpdate: (data: {
    require_current_location: boolean
    require_relocation_willingness: boolean
    minimum_years_experience?: number
    require_work_authorization: boolean
    require_earliest_start_date: boolean
  }) => void
}

const EXPERIENCE_OPTIONS = [
  { value: 0, label: 'No experience required' },
  { value: 1, label: '1+ years' },
  { value: 2, label: '2+ years' },
  { value: 3, label: '3+ years' },
  { value: 5, label: '5+ years' },
  { value: 7, label: '7+ years' },
  { value: 10, label: '10+ years' },
]

export function ApplicationScreeningSection({
  requireCurrentLocation,
  requireRelocationWillingness,
  minimumYearsExperience,
  requireWorkAuthorization,
  requireEarliestStartDate,
  onUpdate,
}: ApplicationScreeningSectionProps) {
  const [localState, setLocalState] = useState({
    require_current_location: requireCurrentLocation,
    require_relocation_willingness: requireRelocationWillingness,
    minimum_years_experience: minimumYearsExperience,
    require_work_authorization: requireWorkAuthorization,
    require_earliest_start_date: requireEarliestStartDate,
  })

  const handleChange = (key: keyof typeof localState, value: boolean | number | undefined) => {
    const newState = { ...localState, [key]: value }
    setLocalState(newState)
    onUpdate(newState)
  }

  return (
    <YStack
      gap="$4"
      p="$4"
      bg="$background"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text fontSize="$6" fontWeight="600">
        Application Requirements
      </Text>
      <Text fontSize="$2" color="$color10">
        Configure what information applicants must provide
      </Text>

      {/* Current Location */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Current location</Label>
          <Text fontSize="$2" color="$color10">
            Ask applicants for their current location
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.require_current_location}
          onCheckedChange={(checked) => handleChange('require_current_location', checked)}
          aria-label="Require current location"
        />
      </XStack>

      {/* Willing to Relocate */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Willing to relocate</Label>
          <Text fontSize="$2" color="$color10">
            Ask if applicants are willing to relocate
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.require_relocation_willingness}
          onCheckedChange={(checked) => handleChange('require_relocation_willingness', checked)}
          aria-label="Require relocation willingness"
        />
      </XStack>

      {/* Minimum Years of Experience */}
      <YStack gap="$2">
        <XStack gap="$3" items="center" justify="space-between">
          <YStack gap="$1" flex={1}>
            <Label>Minimum years of experience</Label>
            <Text fontSize="$2" color="$color10">
              Require minimum experience level
            </Text>
          </YStack>
        </XStack>
        <Select
          value={localState.minimum_years_experience?.toString() || ''}
          onValueChange={(value) =>
            handleChange('minimum_years_experience', value ? Number(value) : undefined)
          }
        >
          <Select.Trigger iconAfter={ChevronDown}>
            <Select.Value placeholder="Select minimum experience" />
          </Select.Trigger>

          <Adapt when="sm" platform="touch">
            <Sheet modal dismissOnSnapToBottom>
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay />
            </Sheet>
          </Adapt>

          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton />
            <Select.Viewport>
              <Select.Group>
                <Select.Label>Experience Level</Select.Label>
                {EXPERIENCE_OPTIONS.map((option, i) => (
                  <Select.Item key={option.value} index={i} value={option.value.toString()}>
                    <Select.ItemText>{option.label}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Viewport>
            <Select.ScrollDownButton />
          </Select.Content>
        </Select>
      </YStack>

      {/* Work Authorization */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Authorized to work in US</Label>
          <Text fontSize="$2" color="$color10">
            Require work authorization status
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.require_work_authorization}
          onCheckedChange={(checked) => handleChange('require_work_authorization', checked)}
          aria-label="Require work authorization"
        />
      </XStack>

      {/* Earliest Start Date */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Earliest start date</Label>
          <Text fontSize="$2" color="$color10">
            Ask when applicants can start
          </Text>
        </YStack>
        <ToggleSwitch
          checked={localState.require_earliest_start_date}
          onCheckedChange={(checked) => handleChange('require_earliest_start_date', checked)}
          aria-label="Require earliest start date"
        />
      </XStack>
    </YStack>
  )
}
