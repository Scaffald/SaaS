import type { Control, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'
import { useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Platform, TextInput } from 'react-native'

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
      render={({ fieldState: { invalid }, field: { value, onChange, ref } }) => {
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

        const bgColor = invalid
          ? theme === 'light'
            ? colors.error[50]
            : colors.error[900]
          : value
            ? colors.bg[theme].subtle
            : colors.bg[theme].muted

        return (
          <TextInput
            ref={ref}
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
            {...(Platform.OS === 'web' && {
              onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
                e.preventDefault()
                handleChange(e.clipboardData.getData('text'))
              },
            } as object)}
            style={[
              {
                width: 52,
                height: 52,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: invalid
                  ? colors.border[theme].error
                  : colors.border[theme].default,
                backgroundColor: bgColor,
                textAlign: 'center',
                fontSize: 24,
                lineHeight: 28,
                color: colors.text[theme].primary,
              },
              Platform.OS === 'web' && ({ outlineStyle: 'none' } as object),
            ]}
          />
        )
      }}
    />
  )
}

export type { FormFields }
