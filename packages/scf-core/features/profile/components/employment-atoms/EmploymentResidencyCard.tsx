import type { UpdateEmploymentParams } from '@scaffald/sdk'
import {
  USPassportToggle,
  USResidentToggle,
} from '@scf/core/features/profile/components/employment-fields'
import { Stack, Text } from '@scaffald/ui'
import { useCallback, useRef } from 'react'

export interface EmploymentResidencyCardProps {
  usResident: boolean
  usPassport: boolean
  onSave: (payload: UpdateEmploymentParams) => void
  isSaving?: boolean
  disabled?: boolean
}

/**
 * Atomic card: residency (us_resident + us_passport). Saves on each toggle change.
 */
export function EmploymentResidencyCard({
  usResident,
  usPassport,
  onSave,
  isSaving = false,
  disabled = false,
}: EmploymentResidencyCardProps) {
  const lastSavedRef = useRef({
    us_resident: usResident,
    us_passport: usPassport,
  })

  const saveResident = useCallback(
    (checked: boolean) => {
      if (lastSavedRef.current.us_resident === checked) return
      lastSavedRef.current.us_resident = checked
      onSave({ us_resident: checked })
    },
    [onSave]
  )

  const savePassport = useCallback(
    (checked: boolean) => {
      if (lastSavedRef.current.us_passport === checked) return
      lastSavedRef.current.us_passport = checked
      onSave({ us_passport: checked })
    },
    [onSave]
  )

  return (
    <Stack gap={12}>
      <Text>Residency</Text>
      <USResidentToggle
        checked={usResident ?? false}
        onChange={saveResident}
        disabled={disabled || isSaving}
      />
      <USPassportToggle
        checked={usPassport ?? false}
        onChange={savePassport}
        disabled={disabled || isSaving}
      />
      {isSaving && (
        <Text size="sm" style={{ color: '#637083' }}>
          Saving...
        </Text>
      )}
    </Stack>
  )
}
