import { useEffect, useState } from 'react'
import { Input, Text, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useThemeContext } from '@scaffald/ui'
import { monthInputFromValue, monthValueFromInput } from '../utils/month-value'

interface PickerChrome {
  disabled?: boolean
  error?: string
  label?: string
}

export interface MonthPickerProps extends PickerChrome {
  /** Stored value, `YYYY-MM-DD` (only the year and month are read). */
  value: string | null | undefined
  /** Emits `YYYY-MM-01`, or null while the text is not a whole month. */
  onChange: (value: string | null) => void
}

/**
 * Month/year picker over plain `YYYY-MM-01` strings — no `Date`, so no time
 * zone can shift the month (#1358). Use this for anything stored as a DATE.
 */
export function MonthPicker({ value, onChange, disabled, error, label }: MonthPickerProps) {
  useThemeContext()
  const [text, setText] = useState(() => monthInputFromValue(value))

  // Follow the stored value when the form changes it (load, reset), but leave
  // a half-typed month alone: it emits null, and wiping the field on every
  // keystroke would make it impossible to type one.
  useEffect(() => {
    const next = monthInputFromValue(value)
    setText((prev) => (monthValueFromInput(prev) === monthValueFromInput(next) ? prev : next))
  }, [value])

  return (
    <Stack gap={4}>
      {label && <Text>{label}</Text>}
      <Input
        value={text}
        onChangeText={(next) => {
          setText(next)
          onChange(monthValueFromInput(next))
        }}
        placeholder="YYYY-MM"
        disabled={disabled}
        style={error ? { borderColor: colors.error[500] } : undefined}
      />
      {error && <Text style={{ color: colors.error[600] }}>{error}</Text>}
    </Stack>
  )
}

export interface MonthYearPickerProps extends PickerChrome {
  value: Date | null
  onChange: (date: Date | null) => void
}

/**
 * `Date` flavour of {@link MonthPicker}, for callers that keep a local `Date`
 * and format it with local getters. Both directions use local time, so it is
 * consistent; anything persisted as a DATE should use `MonthPicker` instead.
 */
export function MonthYearPicker({ value, onChange, ...rest }: MonthYearPickerProps) {
  const stored = value
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-01`
    : null
  return (
    <MonthPicker
      {...rest}
      value={stored}
      onChange={(next) => {
        if (!next) return onChange(null)
        const [year, month] = next.split('-').map(Number)
        onChange(new Date(year, month - 1, 1))
      }}
    />
  )
}
