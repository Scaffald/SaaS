import type { UpdateEmploymentParams } from '@scaffald/sdk'
import { Card, Checkbox, IconCircle, Row, Stack, Text, Toggle } from '@scaffald/ui'
import { Calendar } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable } from 'react-native'
import { AVAILABILITY_OPTIONS } from '@scf/supabase/client-types'
import { profileEmploymentInputSchema } from '@scf/supabase/client-types'

export interface EmploymentAvailabilityCardProps {
  value: string[]
  onSave: (payload: UpdateEmploymentParams) => void
  isSaving?: boolean
  disabled?: boolean
  options?: readonly string[]
}

/**
 * Atomic card: availability. Saves on toggle/option change.
 */
export function EmploymentAvailabilityCard({
  value,
  onSave,
  isSaving = false,
  disabled = false,
  options = AVAILABILITY_OPTIONS,
}: EmploymentAvailabilityCardProps) {
  const selectedValues = value ?? []
  const hasValues = selectedValues.length > 0
  const [isExpanded, setIsExpanded] = useState(hasValues)
  const lastSavedRef = useRef<string>(JSON.stringify(selectedValues))

  useEffect(() => {
    setIsExpanded(hasValues)
  }, [hasValues])

  const save = useCallback(
    (next: string[]) => {
      const result = profileEmploymentInputSchema
        .pick({ availability: true })
        .safeParse({ availability: next })
      if (!result.success) return
      const serialized = JSON.stringify(next)
      if (lastSavedRef.current === serialized) return
      lastSavedRef.current = serialized
      onSave({
        availability: result.data.availability ?? [],
      })
    },
    [onSave]
  )

  const handleToggleChange = useCallback(
    (checked: boolean) => {
      setIsExpanded(checked)
      if (!checked) {
        save([])
      }
    },
    [save]
  )

  const handleOptionChange = useCallback(
    (option: string, checked: boolean) => {
      if (checked) {
        if (!selectedValues.includes(option)) {
          save([...selectedValues, option])
        }
      } else {
        save(selectedValues.filter((item) => item !== option))
      }
    },
    [selectedValues, save]
  )

  return (
    <Stack gap={12}>
      <Text>Availability</Text>
      <Card variant="outlined" radius="md" testID="availability-toggle">
        <Row gap={12} align="center" style={{ padding: 12 }}>
          <IconCircle icon={Calendar} />
          <Stack style={{ flex: 1, gap: 4 }}>
            <Text weight="medium">I'm available for work</Text>
            <Text size="sm">Select all that apply</Text>
          </Stack>
          <Toggle
            checked={isExpanded || hasValues}
            onChange={(c) => handleToggleChange(Boolean(c))}
            accessibilityLabel="I'm available for work"
            disabled={disabled || isSaving}
          />
        </Row>
        {(isExpanded || hasValues) && (
          <Stack
            style={{
              gap: 8,
              paddingTop: 8,
              paddingBottom: 12,
              paddingHorizontal: 12,
            }}
          >
            {options.map((option) => {
              const isChecked = selectedValues.includes(option)
              return (
                <Pressable
                  key={option}
                  onPress={() => handleOptionChange(option, !isChecked)}
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    alignItems: 'center',
                  }}
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={(v) => handleOptionChange(option, v)}
                    disabled={disabled || isSaving}
                    accessibilityLabel={option}
                  />
                  <Text>{option}</Text>
                </Pressable>
              )
            })}
          </Stack>
        )}
      </Card>
      {isSaving && (
        <Text size="sm" style={{ color: '#637083' }}>
          Saving...
        </Text>
      )}
    </Stack>
  )
}
