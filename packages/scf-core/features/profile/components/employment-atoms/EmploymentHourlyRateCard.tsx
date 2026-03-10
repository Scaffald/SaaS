import type { UpdateEmploymentParams } from '@scaffald/sdk'
import { Input, Row, Stack, Text } from '@scaffald/ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { profileEmploymentInputSchema } from '@scf/supabase/client-types'

const DEBOUNCE_MS = 600

export interface EmploymentHourlyRateCardProps {
  value: number
  onSave: (payload: UpdateEmploymentParams) => void
  isSaving?: boolean
  disabled?: boolean
}

/**
 * Atomic card: hourly rate. Saves on blur or debounced change.
 */
export function EmploymentHourlyRateCard({
  value,
  onSave,
  isSaving = false,
  disabled = false,
}: EmploymentHourlyRateCardProps) {
  const [local, setLocal] = useState(String(value ?? 0))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(value)

  useEffect(() => {
    setLocal(String(value ?? 0))
  }, [value])

  const commit = useCallback(
    (raw: string) => {
      const numValue = raw ? Number.parseFloat(raw) : 0
      const parsed = Number.isNaN(numValue) ? 0 : numValue
      const result = profileEmploymentInputSchema.pick({
        hourly_rate: true,
      }).safeParse({ hourly_rate: parsed })
      if (!result.success) return
      if (lastSavedRef.current === result.data.hourly_rate) return
      const rate = result.data.hourly_rate ?? 0
      lastSavedRef.current = rate
      onSave({ hourly_rate: rate })
    },
    [onSave]
  )

  const handleChange = useCallback(
    (text: string) => {
      setLocal(text)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      const numValue = text ? Number.parseFloat(text) : 0
      const parsed = Number.isNaN(numValue) ? 0 : numValue
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        commit(String(parsed))
      }, DEBOUNCE_MS)
    },
    [commit]
  )

  const handleBlur = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    commit(local)
  }, [local, commit])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <Stack gap={8}>
      <Text>Hourly Rate ($)</Text>
      <Row gap={12} align="center">
        <Input
          style={{ flex: 1 }}
          placeholder="Enter your hourly rate"
          value={local}
          onChangeText={handleChange}
          onBlur={handleBlur}
          keyboardType="numeric"
          editable={!disabled && !isSaving}
        />
      </Row>
      {isSaving && (
        <Text size="sm" style={{ color: '#637083' }}>
          Saving...
        </Text>
      )}
    </Stack>
  )
}
