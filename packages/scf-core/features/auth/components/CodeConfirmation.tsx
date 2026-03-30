import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform, View } from 'react-native'
import { useForm } from 'react-hook-form'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { Button, Form, Row } from '@scaffald/ui'

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

  // Handle paste at container level for reliable cross-browser support.
  // React Native Web's TextInput doesn't reliably forward onPaste, so we
  // attach a native DOM listener on the wrapper element instead.
  // biome-ignore lint/suspicious/noExplicitAny: RNW View ref is a DOM element on web
  const containerRef = useRef<any>(null)

  const handlePaste = useCallback(
    (e: Event) => {
      const clipboardEvent = e as ClipboardEvent
      const pasted = clipboardEvent.clipboardData?.getData('text') ?? ''
      const digits = pasted.replace(/\D/g, '').slice(0, codeSize)
      if (digits.length < 2) return // Let single chars flow through normally

      e.preventDefault()
      digits.split('').forEach((d, i) => {
        setValue(`code${i}`, d, { shouldValidate: true })
      })

      // Focus the next empty field or the last field
      const nextEmpty = digits.length < codeSize ? digits.length : codeSize - 1
      setFocus(`code${nextEmpty}`)

      if (digits.length === codeSize) {
        // Defer submit so react-hook-form state has flushed
        setTimeout(() => onSubmit(), 0)
      }
    },
    [codeSize, setValue, setFocus, onSubmit]
  )

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const el = containerRef.current as HTMLElement | null
    if (!el) return
    el.addEventListener('paste', handlePaste, true)
    return () => el.removeEventListener('paste', handlePaste, true)
  }, [handlePaste])

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
    <View ref={containerRef} style={{ paddingTop: 12, paddingBottom: 24, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
    </View>
  )
}
