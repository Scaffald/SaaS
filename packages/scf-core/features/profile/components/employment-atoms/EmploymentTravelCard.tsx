import type { UpdateEmploymentParams } from '@scaffald/sdk'
import { OpenToTravelCard } from '@scf/core/features/profile/components/employment-fields'
import { Stack, Text } from '@scaffald/ui'
import { useCallback, useRef } from 'react'
import { profileEmploymentInputSchema } from '@scf/supabase/client-types'

export interface EmploymentTravelCardProps {
  openToTravel: boolean
  travelDistanceMiles: number
  onSave: (payload: UpdateEmploymentParams) => void
  isSaving?: boolean
  disabled?: boolean
}

/**
 * Atomic card: travel preferences (open_to_travel + travel_distance_miles).
 * Saves on toggle or slider change; validates travel distance when open to travel.
 */
export function EmploymentTravelCard({
  openToTravel,
  travelDistanceMiles,
  onSave,
  isSaving = false,
  disabled = false,
}: EmploymentTravelCardProps) {
  const lastSavedRef = useRef({
    open_to_travel: openToTravel,
    travel_distance_miles: travelDistanceMiles,
  })

  const save = useCallback(
    (payload: { open_to_travel?: boolean; travel_distance_miles?: number }) => {
      const next = {
        open_to_travel: payload.open_to_travel ?? openToTravel,
        travel_distance_miles:
          payload.travel_distance_miles ?? travelDistanceMiles ?? 25,
      }
      const result = profileEmploymentInputSchema.safeParse(next)
      if (!result.success) return
      if (
        lastSavedRef.current.open_to_travel === result.data.open_to_travel &&
        lastSavedRef.current.travel_distance_miles ===
          (result.data.travel_distance_miles ?? 25)
      ) {
        return
      }
      lastSavedRef.current = {
        open_to_travel: result.data.open_to_travel ?? true,
        travel_distance_miles: result.data.travel_distance_miles ?? 25,
      }
      onSave({
        open_to_travel: lastSavedRef.current.open_to_travel,
        travel_distance_miles: lastSavedRef.current.travel_distance_miles,
      })
    },
    [openToTravel, travelDistanceMiles, onSave]
  )

  const handleToggle = useCallback(
    (checked: boolean) => {
      save({
        open_to_travel: checked,
        travel_distance_miles: checked ? travelDistanceMiles ?? 25 : 25,
      })
    },
    [travelDistanceMiles, save]
  )

  const handleTravelDistanceChange = useCallback(
    (value: number) => {
      save({ travel_distance_miles: value })
    },
    [save]
  )

  return (
    <Stack gap={12}>
      <Text>Travel Preferences</Text>
      <OpenToTravelCard
        checked={openToTravel ?? true}
        onChange={handleToggle}
        travelDistanceValue={travelDistanceMiles ?? 25}
        onTravelDistanceChange={handleTravelDistanceChange}
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
