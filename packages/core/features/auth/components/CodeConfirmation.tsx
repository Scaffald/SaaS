import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { SizeTokens } from '@unicornlove/ui'
import { Form, View } from '@unicornlove/ui'

import { CodeConfirmationInput, type FormFields } from './CodeConfirmationInput'

interface CodeConfirmationProps {
  size?: SizeTokens
  codeSize: number
  secureText?: boolean
  onEnter: (code: number) => void
}

export function CodeConfirmation({ size, codeSize, secureText, onEnter }: CodeConfirmationProps) {
  const defaultValues = Array.from({ length: codeSize }, (_, i) => `code${i}`).reduce(
    (acc, key) => {
      acc[key] = ''
      return acc
    },
    {} as Record<string, string>
  )

  const { control, setFocus, register, handleSubmit, setValue, formState } = useForm<FormFields>({
    defaultValues: defaultValues,
  })

  const switchInputPlace = (currentInput: number, value: string) => {
    if (value === '') {
      setFocus(`code${currentInput - 1}`)
    } else {
      setFocus(`code${currentInput + 1}`)
    }
  }

  const onSubmit = handleSubmit((data) => {
    const code = Number(Object.values(data).join(''))
    onEnter(code)
  })

  const [translateX, setTranslateX] = useState(0)
  const [isValid, setValid] = useState(true)

  useEffect(() => {
    if (Object.keys(formState.errors).length > 0) {
      setValid(false)
    }
  }, [formState.errors])

  // shake animation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    interval = setInterval(() => {
      if (isValid) {
        setTranslateX(0)
      } else {
        setValid(false)
        setTranslateX((prevState) => {
          if (prevState === 0) return -16
          if (prevState < 0) return Math.abs(prevState) - 2
          setValid(true)
          return -(prevState - 2)
        })
      }
    }, 50)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isValid])

  return (
    <View paddingTop="$3" paddingBottom="$6" flex={1} alignItems="center" justifyContent="center">
      <Form
        gap="$2"
        alignItems="center"
        justifyContent="center"
        x={translateX}
        animation="bouncy"
        marginTop="$2"
        flexDirection="row"
        onSubmit={onSubmit}
        marginBottom="$0"
        paddingBottom="$0"
      >
        {Array(codeSize)
          .fill(null)
          .map((_, id) => {
            return (
              <CodeConfirmationInput
                key={`code-input-${id}-${codeSize}`}
                id={id}
                size={size}
                codeSize={codeSize}
                secureTextEntry={secureText}
                control={control}
                register={register}
                setValue={setValue}
                switchInputPlace={switchInputPlace}
                onSubmit={onSubmit}
              />
            )
          })}
      </Form>
    </View>
  )
}
