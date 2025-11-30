import { ResponsiveSelect, Text, ToggleSwitch, XStack, YStack } from '@scaffald/tamagui-ui'
import { useState } from 'react'
import { Label } from 'tamagui'

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
    minimum_years_experience_enabled: minimumYearsExperience !== undefined,
  })

  const handleChange = (key: keyof typeof localState, value: boolean | number | undefined) => {
    const newState = { ...localState, [key]: value }
    setLocalState(newState)

    // If disabling experience requirement, clear the value
    if (key === 'minimum_years_experience_enabled' && value === false) {
      newState.minimum_years_experience = undefined
    }

    onUpdate({
      require_current_location: newState.require_current_location,
      require_relocation_willingness: newState.require_relocation_willingness,
      minimum_years_experience: newState.minimum_years_experience_enabled
        ? newState.minimum_years_experience
        : undefined,
      require_work_authorization: newState.require_work_authorization,
      require_earliest_start_date: newState.require_earliest_start_date,
    })
  }

  return (
    <YStack gap="$4">
      {/* Current Location */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Current location</Label>
        </YStack>
        <XStack gap="$2" items="center">
          <Text fontSize="$2" color="$color10">
            {localState.require_current_location ? '1' : '0'}
          </Text>
          <ToggleSwitch
            checked={localState.require_current_location}
            onCheckedChange={(checked) => handleChange('require_current_location', checked)}
            aria-label="Require current location"
          />
        </XStack>
      </XStack>

      {/* Willing to Relocate */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Willing to relocate</Label>
        </YStack>
        <XStack gap="$2" items="center">
          <Text fontSize="$2" color="$color10">
            {localState.require_relocation_willingness ? '1' : '0'}
          </Text>
          <ToggleSwitch
            checked={localState.require_relocation_willingness}
            onCheckedChange={(checked) => handleChange('require_relocation_willingness', checked)}
            aria-label="Require relocation willingness"
          />
        </XStack>
      </XStack>

      {/* Minimum Years of Experience */}
      <YStack gap="$2">
        <XStack gap="$3" items="center" justify="space-between">
          <YStack gap="$1" flex={1}>
            <Label>Minimum years of experience</Label>
          </YStack>
          <XStack gap="$2" items="center">
            <Text fontSize="$2" color="$color10">
              {localState.minimum_years_experience_enabled ? '1' : '0'}
            </Text>
            <ToggleSwitch
              checked={localState.minimum_years_experience_enabled}
              onCheckedChange={(checked) =>
                handleChange('minimum_years_experience_enabled', checked)
              }
              aria-label="Require minimum years of experience"
            />
          </XStack>
        </XStack>
        {localState.minimum_years_experience_enabled && (
          <ResponsiveSelect
            value={localState.minimum_years_experience?.toString() || ''}
            onValueChange={(value) =>
              handleChange('minimum_years_experience', value ? Number(value) : undefined)
            }
            placeholder="Select"
            options={EXPERIENCE_OPTIONS.map((option) => ({
              value: option.value.toString(),
              label: option.label,
            }))}
          />
        )}
      </YStack>

      {/* Work Authorization */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Authorized to work in US</Label>
        </YStack>
        <XStack gap="$2" items="center">
          <Text fontSize="$2" color="$color10">
            {localState.require_work_authorization ? '1' : '0'}
          </Text>
          <ToggleSwitch
            checked={localState.require_work_authorization}
            onCheckedChange={(checked) => handleChange('require_work_authorization', checked)}
            aria-label="Require work authorization"
          />
        </XStack>
      </XStack>

      {/* Earliest Start Date */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label>Earliest start date</Label>
        </YStack>
        <XStack gap="$2" items="center">
          <Text fontSize="$2" color="$color10">
            {localState.require_earliest_start_date ? '1' : '0'}
          </Text>
          <ToggleSwitch
            checked={localState.require_earliest_start_date}
            onCheckedChange={(checked) => handleChange('require_earliest_start_date', checked)}
            aria-label="Require earliest start date"
          />
        </XStack>
      </XStack>
    </YStack>
  )
}
