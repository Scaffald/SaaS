import type { UpdateEmploymentParams } from '@scaffald/sdk'
import { Card, Checkbox, IconCircle, Row, Stack, Text, Toggle } from '@scaffald/ui'
import { Car } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable } from 'react-native'
import { DRIVERS_LICENSE_OPTIONS } from '@scf/supabase/client-types'
import { profileEmploymentInputSchema } from '@scf/supabase/client-types'

export interface EmploymentDriversLicenseCardProps {
  value: string[]
  onSave: (payload: UpdateEmploymentParams) => void
  isSaving?: boolean
  disabled?: boolean
  options?: readonly string[]
}

const OPTIONS = DRIVERS_LICENSE_OPTIONS as unknown as readonly string[]

/**
 * Atomic card: driver's license classes. Saves on toggle/option change.
 */
export function EmploymentDriversLicenseCard({
  value,
  onSave,
  isSaving = false,
  disabled = false,
  options = OPTIONS,
}: EmploymentDriversLicenseCardProps) {
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
        .pick({ drivers_license_classes: true })
        .safeParse({ drivers_license_classes: next })
      if (!result.success) return
      const serialized = JSON.stringify(next)
      if (lastSavedRef.current === serialized) return
      lastSavedRef.current = serialized
      onSave({
        drivers_license_classes: result.data.drivers_license_classes ?? [],
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
      <Text>Driver's License</Text>
      <Card variant="outlined" radius="md" testID="drivers-license-toggle">
        <Row gap={12} align="center" style={{ padding: 12 }}>
          <IconCircle icon={Car} />
          <Stack style={{ flex: 1, gap: 4 }}>
            <Text weight="medium">I have a valid driver's license</Text>
            <Text size="sm">Select all license classes that apply</Text>
          </Stack>
          <Toggle
            checked={isExpanded || hasValues}
            onChange={(c) => handleToggleChange(Boolean(c))}
            accessibilityLabel="I have a valid driver's license"
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
