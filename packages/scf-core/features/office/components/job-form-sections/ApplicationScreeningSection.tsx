import { ResponsiveSelect, Text, ToggleSwitch, Row, Stack } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Label } from '@unicornlove/beyond-ui'

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
    <Stack gap={16}>
      {/* Current Location */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Current location</Label>
        </Stack>
        <Row gap={8} align="center">
          <Text color="gray">
            {localState.require_current_location ? '1' : '0'}
          </Text>
          <ToggleSwitch
            checked={localState.require_current_location}
            onCheckedChange={(checked) => handleChange('require_current_location', checked)}
            aria-label="Require current location"
          />
        </Row>
      </Row>

      {/* Willing to Relocate */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Willing to relocate</Label>
        </Stack>
        <Row gap={8} align="center">
          <Text color="gray">
            {localState.require_relocation_willingness ? '1' : '0'}
          </Text>
          <ToggleSwitch
            checked={localState.require_relocation_willingness}
            onCheckedChange={(checked) => handleChange('require_relocation_willingness', checked)}
            aria-label="Require relocation willingness"
          />
        </Row>
      </Row>

      {/* Minimum Years of Experience */}
      <Stack gap={8}>
        <Row gap={12} align="center" justify="space-between">
          <Stack gap={4} flex={1}>
            <Label>Minimum years of experience</Label>
          </Stack>
          <Row gap={8} align="center">
            <Text color="gray">
              {localState.minimum_years_experience_enabled ? '1' : '0'}
            </Text>
            <ToggleSwitch
              checked={localState.minimum_years_experience_enabled}
              onCheckedChange={(checked) =>
                handleChange('minimum_years_experience_enabled', checked)
              }
              aria-label="Require minimum years of experience"
            />
          </Row>
        </Row>
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
      </Stack>

      {/* Work Authorization */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Authorized to work in US</Label>
        </Stack>
        <Row gap={8} align="center">
          <Text color="gray">
            {localState.require_work_authorization ? '1' : '0'}
          </Text>
          <ToggleSwitch
            checked={localState.require_work_authorization}
            onCheckedChange={(checked) => handleChange('require_work_authorization', checked)}
            aria-label="Require work authorization"
          />
        </Row>
      </Row>

      {/* Earliest Start Date */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Earliest start date</Label>
        </Stack>
        <Row gap={8} align="center">
          <Text color="gray">
            {localState.require_earliest_start_date ? '1' : '0'}
          </Text>
          <ToggleSwitch
            checked={localState.require_earliest_start_date}
            onCheckedChange={(checked) => handleChange('require_earliest_start_date', checked)}
            aria-label="Require earliest start date"
          />
        </Row>
      </Row>
    </Stack>
  )
}
