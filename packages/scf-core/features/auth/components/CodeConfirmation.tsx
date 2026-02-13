import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Box, Form, Row } from '@scaffald/ui'

import { CodeConfirmationInput, type FormFields } from './CodeConfirmationInput'

interface CodeConfirmationProps {
  codeSize: number
  secureText?: boolean
  onEnter: (code: number) => void
}

export function CodeConfirmation({ codeSize, secureText, onEnter }: CodeConfirmationProps) {
  const defaultValues = Array.from({ length: codeSize }, (_, i) => `code${i}`).reduce(
    (acc, key) => {
      acc[key] = ''
      return acc
    },
    {} as Record<string, string>
  )

  const { control, setFocus, register, handleSubmit, setValue, formState } = useForm<FormFields>({
    defaultValues,
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
    <Box paddingTop={12} paddingBottom={24} flex={1} align="center" justify="center">
      <Form onSubmit={onSubmit} gap={8}>
        <Row
          gap={8}
          align="center"
          justify="center"
          style={{
            transform: [{ translateX }],
            marginTop: 8,
            marginBottom: 0,
            paddingBottom: 0,
          }}
        >
          {Array.from({ length: codeSize }, (_, id) => (
            <CodeConfirmationInput
              key={`code-input-${id}-${codeSize}`}
              id={id}
              codeSize={codeSize}
              secureTextEntry={secureText}
              control={control}
              register={register}
              setValue={setValue}
              switchInputPlace={switchInputPlace}
              onSubmit={onSubmit}
            />
          ))}
        </Row>
      </Form>
    </Box>
  )
}
