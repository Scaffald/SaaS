import { useEffect, useState, useRef, useCallback } from 'react'
import type { Control, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { Controller, useForm } from 'react-hook-form'
import type { SizeTokens } from 'tamagui'
import {
  AnimatePresence,
  Form,
  Input,
  Paragraph,
  Spinner,
  View,
  Button,
  XStack,
  YStack,
  Label,
  Text,
  H2,
} from 'tamagui'

import {
  CheckCircle2,
  ChevronLeft,
  KeySquare,
  LockKeyhole,
  Mail,
  RefreshCcw,
  Smartphone,
} from '@tamagui/lucide-icons'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'

type MagicLinkPendingProps = {
  email?: string
  onBack: () => void
}

interface CodeConfirmationInputProps {
  id: number
  size?: SizeTokens
  codeSize: number
  secureTextEntry?: boolean
  control: Control<FormFields>
  register: UseFormRegister<FormFields>
  setValue: UseFormSetValue<FormFields>
  switchInputPlace: (currentField: number, value: string) => void
  onSubmit: () => void
}

interface FormFields {
  [key: string]: string
}

function CodeConfirmationInput({
  id,
  codeSize,
  secureTextEntry,
  control,
  register,
  setValue,
  switchInputPlace,
  onSubmit,
}: CodeConfirmationInputProps) {
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
            // Max length is disabled to enable multiple digit paste
            if (code.length === codeSize) {
              // Paste logic
              const digits = code.split('')
              digits.forEach((digit, index) => {
                // Set each digit to the corresponding input
                setValue(`code${index}`, digit)
              })
              onSubmit()
            } else {
              // Manual input logic
              // Only take the first digit (disables multiple digits in one input)
              onChange(code.split('')[0])
              // Focus next input
              switchInputPlace(id, code)

              // Submit on last input
              if (id === codeSize - 1) {
                onSubmit()
              }
            }
          }}
          onKeyPress={(e) => {
            const event = e.nativeEvent
            if (event.key === 'Backspace') {
              // Prevent the backspace key from navigating back
              e.preventDefault()

              if (value !== '') {
                // Reset input field
                onChange('')
              } else {
                // Set focus to the previous input
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
          enterKeyHint={id === codeSize - 1 ? 'done' : 'next'}
          textAlign="center"
          fontSize="$8"
          borderRadius="$5"
          theme="active"
          aspectRatio={1}
          w="100%"
          h="100%"
          flex={1}
          backgroundColor={invalid ? '$red7' : value ? '$color1' : '$color5'}
          hoverStyle={{ outlineWidth: 0 }}
          focusStyle={{
            backgroundColor: invalid ? '$red8' : '$color1',
            outlineWidth: 0,
          }}
        />
      )}
    />
  )
}

interface CodeConfirmationProps {
  size?: SizeTokens
  codeSize: number
  secureText?: boolean
  onEnter: (code: number) => void
}

function CodeConfirmation({ size, codeSize, secureText, onEnter }: CodeConfirmationProps) {
  const defaultValues = Array.from({ length: codeSize }, (_, i) => `code${i}`).reduce(
    (acc, key) => ({ ...acc, [key]: '' }),
    {}
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
  }, [formState.isValidating])

  // shake animation
  useEffect(() => {
    let interval: number | null = null

    interval = window.setInterval(() => {
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
      if (interval) window.clearInterval(interval)
    }
  }, [isValid])

  return (
    <Form
      gap="$2"
      alignItems="center"
      minWidth="100%"
      justifyContent="center"
      x={translateX}
      animation="bouncy"
      w="100%"
      mt="$2"
      flexDirection="row"
      onSubmit={onSubmit}
      mb="$0"
      pb="$0"
    >
      {Array(codeSize)
        .fill(null)
        .map((_, id) => {
          return (
            <CodeConfirmationInput
              key={`code${id}`}
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
  )
}

// ResendTimer component
const ResendTimer = ({
  onComplete,
  onResendClick,
}: {
  onComplete: () => void
  onResendClick: () => void
}) => {
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [seconds, setSeconds] = useState(30)
  const startTimeRef = useRef<number>(null)
  const rafIdRef = useRef<number>(null)

  const handleResendClick = () => {
    setIsTimerActive(true)
    onResendClick()
  }

  useEffect(() => {
    if (!isTimerActive || seconds === 0) return

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const newSeconds = 30 - Math.floor(elapsed / 1000)

      if (newSeconds <= 0) {
        setSeconds(0)
        setIsTimerActive(false)
        onComplete()
        return
      }

      if (newSeconds !== seconds) {
        setSeconds(newSeconds)
      }

      rafIdRef.current = requestAnimationFrame(animate)
    }

    rafIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
      startTimeRef.current = null
    }
  }, [isTimerActive, seconds === 0, onComplete])

  if (!isTimerActive) {
    return (
      <XStack
        alignItems="center"
        alignSelf="flex-end"
        justifyContent="flex-end"
        gap="$2"
        className="flex"
        cursor="pointer"
        onPress={handleResendClick}
      >
        <RefreshCcw size={12} color="$blue10" />
        <Paragraph color="$blue10" textAlign="right" fontSize="$1">
          Resend OTP
        </Paragraph>
      </XStack>
    )
  }

  return (
    <XStack
      alignItems="center"
      alignSelf="flex-end"
      justifyContent="flex-end"
      gap="$2"
      className="flex"
      cursor="default"
    >
      <RefreshCcw size={12} color="$color10" />
      <Paragraph color="$color10" textAlign="right" fontSize="$1">
        Resend in {seconds} {seconds > 1 ? 'seconds' : 'second'}
      </Paragraph>
    </XStack>
  )
}

export const MagicLinkPending = ({ email, onBack }: MagicLinkPendingProps) => {
  const supabase = useSupabase()
  const [code, setCode] = useState<number>()
  const [codeEntered, setCodeEntered] = useState(false)
  const [verified, setVerified] = useState(false)
  const [_isResendEnabled, setIsResendEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEnter = useCallback(
    async (code: number) => {
      setCode(code)
      setIsSubmitting(true)
      setError(null)

      try {
        if (!email) {
          throw new Error('Please go back and request a new code.')
        }

        const { error } = await supabase.auth.verifyOtp({
          email,
          token: code.toString(),
          type: 'email',
        })

        if (error) {
          console.error('OTP verification error:', error)

          // Provide user-friendly error messages
          let userMessage = error.message
          if (
            error.message.includes('otp_expired') ||
            error.message.includes('Token has expired')
          ) {
            userMessage = 'The verification code has expired. Please request a new one.'
          } else if (error.message.includes('invalid') || error.message.includes('otp_not_found')) {
            userMessage = 'Invalid verification code. Please check and try again.'
          } else if (error.message.includes('too_many_requests')) {
            userMessage = 'Too many attempts. Please wait before trying again.'
          }

          throw new Error(userMessage)
        }

        console.log('OTP verification successful')
        setVerified(true)
        setCodeEntered(true)
      } catch (err) {
        console.error('Error during OTP verification:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
        // Reset the code and UI state on error
        setCode(undefined)
        setCodeEntered(false)
        setVerified(false)
      } finally {
        setIsSubmitting(false)
      }
    },
    [email, supabase]
  )

  const handleResendComplete = useCallback(() => {
    setIsResendEnabled(true)
  }, [])

  const handleResendClick = useCallback(async () => {
    if (!email) return

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    }
  }, [email, supabase])

  const displayEmail = email ?? 'your email address'

  return (
    <View alignItems="center" justifyContent="center" gap="$4">
      <View
        minWidth={300}
        ai="center"
        jc="center"
        borderRadius="$8"
        overflow="hidden"
        p="$5"
        w="100%"
        maxWidth={400}
      >
        <View position="absolute" t="$4" r="$4">
          {codeEntered ? (
            <View animation="bouncy" key="success" flexDirection="row" gap="$2">
              <AnimatePresence>
                {verified && (
                  <Paragraph
                    key="success"
                    color="$green10"
                    enterStyle={{ opacity: 0, x: 15 }}
                    exitStyle={{ opacity: 0, x: 15, scale: 0.5 }}
                    animation="200ms"
                  >
                    Success
                  </Paragraph>
                )}
              </AnimatePresence>
              <View enterStyle={{ opacity: 0.5, scale: 1.5 }} animation="bouncy">
                <CheckCircle2 color="$green10" />
              </View>
            </View>
          ) : (
            <View key="email" enterStyle={{ opacity: 0.5, scale: 1.5 }} animation="100ms">
              <Mail size={16} opacity={0.25} />
            </View>
          )}
        </View>

        <View
          key="code"
          animation="200ms"
          w="100%"
          opacity={codeEntered ? 0 : 1}
          pointerEvents={codeEntered ? 'none' : 'auto'}
          transform={[{ translateX: codeEntered ? -150 : 0 }]}
        >
          <YStack
            key="code"
            animation="200ms"
            exitStyle={{ opacity: 0 }}
            justifyContent="space-between"
            gap="$4"
            w="100%"
            opacity={code ? 0 : 1}
            h="auto"
          >
            <View alignItems="center" gap="$2">
              <H2 fontWeight="700" fontSize="$6" $gtMd={{ fontSize: '$8' }} color="$color12">
                Check your email
              </H2>

              <View
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                gap="$2"
                w="100%"
              >
                <Mail size="$1" color="$color12" />
                <Paragraph size="$4" fontWeight="500" color="$color12">
                  {displayEmail}
                </Paragraph>
              </View>

              <Paragraph theme="alt1" textAlign="center">
                Open the link in your email or enter the code below to sign in.
              </Paragraph>
            </View>

            <View px="$4" $gtMd={{ px: 0 }}>
              <YStack gap="$2">
                <CodeConfirmation size="$5" codeSize={6} secureText={false} onEnter={handleEnter} />

                <ResendTimer onComplete={handleResendComplete} onResendClick={handleResendClick} />
              </YStack>
            </View>

            {error && (
              <Paragraph color="$red10" textAlign="center" fontSize="$2">
                {error}
              </Paragraph>
            )}

            <XStack
              borderColor="$transparent"
              onPress={onBack}
              gap="$2"
              ai="center"
              jc="center"
              cursor="pointer"
            >
              <ChevronLeft size={16} color="$color10" />
              <Paragraph color="$color11">Back</Paragraph>
            </XStack>
          </YStack>

          {code ? (
            <View
              position="absolute"
              w="100%"
              h="100%"
              alignItems="center"
              justifyContent="center"
              bg="$backgroundColor"
            >
              <Spinner color="$color10" />
            </View>
          ) : null}
        </View>

        <View
          position="absolute"
          enterStyle={{ opacity: 0, x: 350 }}
          exitStyle={{ opacity: 0, x: 0 }}
          bg="$backgroundColor"
          ai="center"
          jc="center"
          w="full"
          h="100%"
          $gtMd={{ w: '100%', p: '$5' }}
          animation={'200ms'}
          opacity={!codeEntered ? 0 : 1}
          pointerEvents={!codeEntered ? 'none' : 'auto'}
          transform={[{ translateX: !codeEntered ? 150 : 0 }]}
        >
          <AnimatePresence>
            {codeEntered && (
              <View
                w="100%"
                h="100%"
                justifyContent="space-between"
                alignItems="center"
                gap="$4"
                pt="$6"
              >
                <YStack flexGrow={1} justifyContent="center" alignItems="center" w="100%" gap="$2">
                  <Text fontWeight="bold" fontSize="$6">
                    Code Verified
                  </Text>

                  <Paragraph color="$color10" textAlign="center">
                    Congratulations, successful confirmation
                  </Paragraph>
                </YStack>

                <Button minWidth="100%" themeInverse>
                  Continue
                </Button>
              </View>
            )}
          </AnimatePresence>
        </View>
      </View>
    </View>
  )
}
