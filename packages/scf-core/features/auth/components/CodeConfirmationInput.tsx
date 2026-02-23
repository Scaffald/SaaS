import type { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form'
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
  register: UseFormRegister<FormFields>
  setValue: UseFormSetValue<FormFields>
  switchInputPlace: (currentField: number, value: string) => void
  onSubmit: () => void
}

export function CodeConfirmationInput({
  id,
  codeSize,
  secureTextEntry,
  control,
  register,
  setValue,
  switchInputPlace,
  onSubmit,
}: CodeConfirmationInputProps) {
  const { theme } = useThemeContext()

  return (
    <Controller
      name={`code${id}`}
      defaultValue=""
      control={control}
      rules={{ required: true, pattern: /^[0-9]*$/ }}
      render={({ fieldState: { invalid }, field: { value, onChange } }) => (
        <Input
          {...register(`code${id}`)}
          value={value}
          maxLength={codeSize}
          selectTextOnFocus
          onChangeText={(code: string) => {
            if (code.length === codeSize) {
              const digits = code.split('')
              digits.forEach((digit, index) => {
                setValue(`code${index}`, digit)
              })
              onSubmit()
            } else {
              onChange(code.split('')[0])
              switchInputPlace(id, code)
              if (id === codeSize - 1) {
                onSubmit()
              }
            }
          }}
          onKeyPress={(e) => {
            const event = e.nativeEvent
            if (event.key === 'Backspace') {
              e.preventDefault()
              if (value !== '') {
                onChange('')
              } else {
                switchInputPlace(id, value)
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
              ? theme === "light" ? colors.error[50] : colors.error[900]
              : value
                ? colors.bg[theme].subtle
                : colors.bg[theme].muted,
          }}
          contentStyle={{
            textAlign: 'center',
            fontSize: 24,
          }}
        />
      )}
    />
  )
}

export type { FormFields }
