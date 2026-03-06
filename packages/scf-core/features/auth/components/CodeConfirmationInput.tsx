import type { Control, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { Input, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface FormFields {
  [key: string]: string
}

interface CodeConfirmationInputProps {
  id: number
  codeSize: number
  secureTextEntry?: boolean
  control: Control<FormFields>
  setValue: UseFormSetValue<FormFields>
  setFocus: (name: string) => void
  switchInputPlace: (currentField: number, value: string) => void
  onSubmit: () => void
}

/** Defer submit so react-hook-form state has flushed after setValue/onChange */
function deferSubmit(onSubmit: () => void) {
  setTimeout(() => onSubmit(), 0)
}

export function CodeConfirmationInput({
  id,
  codeSize,
  secureTextEntry,
  control,
  setValue,
  setFocus,
  switchInputPlace,
  onSubmit,
}: CodeConfirmationInputProps) {
  const { theme } = useThemeContext()

  return (
    <Controller
      name={`code${id}`}
      defaultValue=""
      control={control}
      rules={{ required: true, pattern: /^[0-9]$/ }}
      render={({ fieldState: { invalid }, field: { value, onChange } }) => {
        const handleChange = (code: string) => {
          const digitsOnly = code.replace(/\D/g, '')
          if (digitsOnly.length >= codeSize) {
            const digits = digitsOnly.slice(0, codeSize).split('')
            digits.forEach((d, index) => {
              setValue(`code${index}`, d)
            })
            deferSubmit(onSubmit)
            return
          }
          const digit = digitsOnly.slice(0, 1)
          onChange(digit)
          if (digit) {
            switchInputPlace(id, digit)
            if (id === codeSize - 1) {
              deferSubmit(onSubmit)
            }
          }
        }
        return (
          <Input
            value={value}
            maxLength={1}
            selectTextOnFocus
            onChangeText={handleChange}
            onKeyPress={(e) => {
              const event = e.nativeEvent
              if (event.key === 'Backspace') {
                if (value !== '') {
                  onChange('')
                } else {
                  setFocus(`code${Math.max(0, id - 1)}`)
                  switchInputPlace(id, '')
                }
              }
              if (event.key === 'Enter') {
                onSubmit()
              }
            }}
            inputMode="numeric"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            secureTextEntry={secureTextEntry}
            style={{
              borderRadius: 12,
              width: 50,
              aspectRatio: 1,
              backgroundColor: invalid
                ? theme === 'light'
                  ? colors.error[50]
                  : colors.error[900]
                : value
                  ? colors.bg[theme].subtle
                  : colors.bg[theme].muted,
            }}
            contentStyle={{
              textAlign: 'center',
              fontSize: 24,
            }}
          />
        )
      }}
    />
  )
}

export type { FormFields }
