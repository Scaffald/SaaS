import { Input, Text, ToggleSwitch, Row, Stack } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Label, TextArea } from '@unicornlove/beyond-ui'

interface LocationSchedulingSectionProps {
  relocationAssistanceOffered?: boolean
  relocationAssistanceDetails?: string
  workScheduleDetails?: string
  timezone?: string
  onUpdate: (data: {
    relocation_assistance_offered?: boolean
    relocation_assistance_details?: string
    work_schedule_details?: string
    timezone?: string
  }) => void
}

export function LocationSchedulingSection({
  relocationAssistanceOffered,
  relocationAssistanceDetails,
  workScheduleDetails,
  timezone,
  onUpdate,
}: LocationSchedulingSectionProps) {
  const [localState, setLocalState] = useState({
    relocation_assistance_offered: relocationAssistanceOffered,
    relocation_assistance_details: relocationAssistanceDetails,
    work_schedule_details: workScheduleDetails,
    timezone,
  })

  const handleChange = (key: keyof typeof localState, value: string | boolean | undefined) => {
    const newState = { ...localState, [key]: value }
    setLocalState(newState)
    onUpdate(newState)
  }

  return (
    <Stack
      gap="$4"
      padding="$4"
      backgroundColor="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text fontSize="$6" fontWeight="600">
        Location & Scheduling
      </Text>
      <Text fontSize="$2" color="$color10">
        Work location and schedule information
      </Text>

      {/* Relocation Assistance */}
      <Row gap="$3" alignItems="center" justifyContent="space-between">
        <Stack gap="$1" flex={1}>
          <Label>Relocation assistance offered</Label>
          <Text fontSize="$2" color="$color10">
            Company provides relocation support
          </Text>
        </Stack>
        <ToggleSwitch
          checked={localState.relocation_assistance_offered || false}
          onCheckedChange={(checked) => handleChange('relocation_assistance_offered', checked)}
          aria-label="Relocation assistance offered"
        />
      </Row>

      {localState.relocation_assistance_offered && (
        <Stack gap="$2">
          <Label>Relocation assistance details</Label>
          <TextArea
            placeholder="Describe relocation assistance provided"
            value={localState.relocation_assistance_details || ''}
            onChangeText={(text) =>
              handleChange('relocation_assistance_details', text || undefined)
            }
            height={80}
          />
        </Stack>
      )}

      {/* Work Schedule Details */}
      <Stack gap="$2">
        <Label>Work schedule details</Label>
        <TextArea
          placeholder="e.g. Monday-Friday 8am-5pm, flexible hours, compressed workweek"
          value={localState.work_schedule_details || ''}
          onChangeText={(text) => handleChange('work_schedule_details', text || undefined)}
          height={80}
        />
      </Stack>

      {/* Timezone */}
      <Stack gap="$2">
        <Label>Timezone</Label>
        <Input
          placeholder="e.g. America/New_York, Pacific Time"
          value={localState.timezone || ''}
          onChangeText={(text) => handleChange('timezone', text || undefined)}
        />
      </Stack>
    </Stack>
  )
}
