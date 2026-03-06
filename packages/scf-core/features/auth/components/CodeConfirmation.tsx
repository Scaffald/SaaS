import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { Box, Button, Form, Row } from '@scaffald/ui'

import { CodeConfirmationInput, type FormFields } from './CodeConfirmationInput'

interface CodeConfirmationProps {
  codeSize: number
  secureText?: boolean
  onEnter: (code: number) => void
}

export function CodeConfirmation({ codeSize, secureText, onEnter }: CodeConfirmationProps) {
  const { t } = useTranslation()
  const defaultValues = Array.from({ length: codeSize }, (_, i) => `code${i}`).reduce(
    (acc, key) => {
      acc[key] = ''
      return acc
    },
    {} as Record<string, string>
  )

  const { control, setFocus, handleSubmit, setValue, formState } = useForm<FormFields>({
    defaultValues,
  })

  const switchInputPlace = (currentInput: number, value: string) => {
    if (value === '') {
      setFocus(`code${Math.max(0, currentInput - 1)}`)
    } else {
      setFocus(`code${Math.min(codeSize - 1, currentInput + 1)}`)
    }
  }

  const onSubmit = handleSubmit((data) => {
    const code = Number(Object.values(data).join(''))
    onEnter(code)
  })

  const hasError = Object.keys(formState.errors).length > 0
  const [shakeOffset, setShakeOffset] = useState(0)

  useEffect(() => {
    if (!hasError) {
      setShakeOffset(0)
      return
    }
    const id = setTimeout(() => {
      setShakeOffset(8)
    }, 0)
    const id2 = setTimeout(() => setShakeOffset(-8), 50)
    const id3 = setTimeout(() => setShakeOffset(6), 100)
    const id4 = setTimeout(() => setShakeOffset(-4), 150)
    const id5 = setTimeout(() => setShakeOffset(0), 200)
    return () => {
      clearTimeout(id)
      clearTimeout(id2)
      clearTimeout(id3)
      clearTimeout(id4)
      clearTimeout(id5)
    }
  }, [hasError])

  return (
    <Box paddingTop={12} paddingBottom={24} flex={1} align="center" justify="center">
      <Form onSubmit={onSubmit} gap={8}>
        <Row
          gap={8}
          align="center"
          justify="center"
          style={{
            transform: [{ translateX: shakeOffset }],
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
              setValue={setValue}
              setFocus={setFocus}
              switchInputPlace={switchInputPlace}
              onSubmit={onSubmit}
            />
          ))}
        </Row>
        <Button
          variant="filled"
          color="primary"
          onPress={onSubmit}
          style={{ marginTop: 16, alignSelf: 'center' }}
          accessibilityLabel={t('auth.verify.verifyButton')}
        >
          {t('auth.verify.verifyButton')}
        </Button>
      </Form>
    </Box>
  )
}
