import { Input, Text, ToggleSwitch, Row, Stack, useThemeContext } from '@scaffald/ui'
import { useState } from 'react'
import { Label, TextArea } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
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
      gap={16}
      padding="md"
      style={{ backgroundColor: colors.bg[theme].default }}
      borderRadius={16}
      borderWidth={1}
      borderColor={colors.border[theme].default}
    >
      <Text>Location & Scheduling</Text>
      <Text style={{ color: colors.text[theme].secondary }}>
        Work location and schedule information
      </Text>

      {/* Relocation Assistance */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Relocation assistance offered</Label>
          <Text style={{ color: colors.text[theme].secondary }}>
            Company provides relocation support
          </Text>
        </Stack>
        <ToggleSwitch
          checked={localState.relocation_assistance_offered || false}
          onChange={(checked) => handleChange('relocation_assistance_offered', checked)}
          aria-label="Relocation assistance offered"
        />
      </Row>

      {localState.relocation_assistance_offered && (
        <Stack gap={8}>
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
      <Stack gap={8}>
        <Label>Work schedule details</Label>
        <TextArea
          placeholder="e.g. Monday-Friday 8am-5pm, flexible hours, compressed workweek"
          value={localState.work_schedule_details || ''}
          onChangeText={(text) => handleChange('work_schedule_details', text || undefined)}
          height={80}
        />
      </Stack>

      {/* Timezone */}
      <Stack gap={8}>
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
