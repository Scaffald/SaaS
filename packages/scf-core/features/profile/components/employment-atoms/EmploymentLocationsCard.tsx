import type { UpdateEmploymentParams } from '@scaffald/sdk'
import { LocationListInput, Stack, Text } from '@scaffald/ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { profileEmploymentInputSchema } from '@scf/supabase/client-types'

const DEBOUNCE_MS = 600

export interface EmploymentLocationsCardProps {
  value: string[]
  onSave: (payload: UpdateEmploymentParams) => void
  isSaving?: boolean
  disabled?: boolean
}

/**
 * Atomic card: preferred work locations. Saves on debounced list change.
 */
export function EmploymentLocationsCard({
  value,
  onSave,
  isSaving = false,
  disabled = false,
}: EmploymentLocationsCardProps) {
  const [local, setLocal] = useState<string[]>(value ?? [])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef<string>(JSON.stringify(value ?? []))

  useEffect(() => {
    setLocal(value ?? [])
  }, [value])

  const commit = useCallback(
    (next: string[]) => {
      const result = profileEmploymentInputSchema
        .pick({ preferred_work_locations: true })
        .safeParse({ preferred_work_locations: next })
      if (!result.success) return
      const serialized = JSON.stringify(next)
      if (lastSavedRef.current === serialized) return
      lastSavedRef.current = serialized
      onSave({
        preferred_work_locations:
          result.data.preferred_work_locations ?? [],
      })
    },
    [onSave]
  )

  const handleChange = useCallback(
    (next: string[]) => {
      setLocal(next)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        commit(next)
      }, DEBOUNCE_MS)
    },
    [commit]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <Stack gap={12} style={{ paddingVertical: 12 }}>
      <Text>Preferred Work Locations</Text>
      <LocationListInput
        value={local}
        onChange={handleChange}
        maxLocations={3}
        helpText="You can add up to three locations. This can be as broad as in a state or county, or specific to a city."
        placeholder="Search for a work location..."
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
