import { forwardRef, useCallback, useEffect, useRef, useState, type ElementRef } from 'react'
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

interface CodeConfirmationInputProps {
  id: number
  size?: SizeTokens
  codeSize: number
  secureTextEntry?: boolean
  value: string
  hasError: boolean
  onChange: (code: string) => void
  onBackspace: () => void
  onSubmit: () => void
}

type InputElement = ElementRef<typeof Input>

const CodeConfirmationInput = forwardRef<InputElement, CodeConfirmationInputProps>(
  function CodeConfirmationInput(
    { id, size, codeSize, secureTextEntry, value, hasError, onChange, onBackspace, onSubmit },
    ref
  ) {
    return (
      <Input
        ref={ref}
        value={value}
        size={size}
        maxLength={codeSize}
        selectTextOnFocus
        onChangeText={onChange}
        onKeyPress={(event) => {
          const key = event.nativeEvent.key
          if (key === 'Backspace') {
            event.preventDefault()
            if (value) {
              onChange('')
            } else {
              onBackspace()
            }
          }

          if (key === 'Enter') {
            onSubmit()
          }
        }}
        onSubmitEditing={onSubmit}
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
        backgroundColor={hasError ? '$red7' : value ? '$color1' : '$color5'}
        hoverStyle={{ outlineWidth: 0 }}
        focusStyle={{
          backgroundColor: hasError ? '$red8' : '$color1',
          outlineWidth: 0,
        }}
      />
    )
  }
)

interface CodeConfirmationProps {
  size?: SizeTokens
  codeSize: number
  secureText?: boolean
  onEnter: (code: number) => void
}

const createEmptyValues = (codeSize: number) => Array.from({ length: codeSize }, () => '')

function CodeConfirmation({ size, codeSize, secureText, onEnter }: CodeConfirmationProps) {
  const [values, setValues] = useState<string[]>(() => createEmptyValues(codeSize))
  const inputRefs = useRef<Array<InputElement | null>>([])
  const [translateX, setTranslateX] = useState(0)
  const [isValid, setValid] = useState(true)

  const focusInput = useCallback(
    (index: number) => {
      if (index < 0 || index >= codeSize) return
      const ref = inputRefs.current[index]
      ref?.focus?.()
    },
    [codeSize]
  )

  const submitValues = useCallback(
    (digits: string[]) => {
      if (!digits.every((digit) => digit.length === 1)) {
        setValid(false)
        return
      }

      setValid(true)
      onEnter(Number(digits.join('')))
    },
    [onEnter]
  )

  const handleChange = useCallback(
    (index: number, text: string) => {
      const sanitized = text.replace(/\D/g, '')
      let nextValues: string[] = []

      setValues((prev) => {
        const next = [...prev]

        if (sanitized.length >= codeSize) {
          const digits = sanitized.slice(0, codeSize).split('')
          for (let i = 0; i < codeSize; i++) {
            next[i] = digits[i] ?? ''
          }
          nextValues = [...next]
          return next
        }

        const digit = sanitized.slice(-1) ?? ''
        next[index] = digit
        nextValues = [...next]
        return next
      })

      if (sanitized.length >= codeSize) {
        focusInput(codeSize - 1)
        submitValues(nextValues)
        return
      }

      if (sanitized) {
        if (index < codeSize - 1) {
          focusInput(index + 1)
        } else if (nextValues.every((digit) => digit.length === 1)) {
          submitValues(nextValues)
        }
      }
    },
    [codeSize, focusInput, submitValues]
  )

  const handleBackspace = useCallback(
    (index: number) => {
      setValues((prev) => {
        const next = [...prev]

        if (next[index]) {
          next[index] = ''
        } else if (index > 0) {
          focusInput(index - 1)
          next[index - 1] = ''
        }

        return next
      })
    },
    [focusInput]
  )

  const handleSubmit = useCallback(() => {
    submitValues(values)
  }, [submitValues, values])

  useEffect(() => {
    if (isValid) {
      setTranslateX(0)
      return
    }

    const interval = setInterval(() => {
      setTranslateX((prev) => {
        if (prev === 0) return -16
        if (prev < 0) return Math.abs(prev) - 2
        setValid(true)
        return -(prev - 2)
      })
    }, 50)

    return () => clearInterval(interval)
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
      onSubmit={handleSubmit}
      mb="$0"
      pb="$0"
    >
      {Array(codeSize)
        .fill(null)
        .map((_, id) => (
          <CodeConfirmationInput
            key={`code${id}`}
            ref={(ref) => {
              inputRefs.current[id] = ref
            }}
            id={id}
            size={size}
            codeSize={codeSize}
            secureTextEntry={secureText}
            value={values[id]}
            hasError={!isValid}
            onChange={(code) => handleChange(id, code)}
            onBackspace={() => handleBackspace(id)}
            onSubmit={handleSubmit}
          />
        ))}
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
  const startTimeRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)

  const handleResendClick = () => {
    setIsTimerActive(true)
    onResendClick()
  }

  useEffect(() => {
    if (!isTimerActive || seconds === 0) return

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
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
  }, [isTimerActive, seconds, onComplete])

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

/** ------ EXAMPLE ------ */
export function OneTimeCodeInputExample({
  size = '$5',
  codeSize = 4,
  secureText = false,
}: {
  size?: SizeTokens
  codeSize?: number
  secureText?: boolean
}) {
  const [code, setCode] = useState<number>()
  const [codeEntered, setCodeEntered] = useState(false)
  const [verified, setVerified] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [activeInterface, setActiveInterface] = useState<'email' | 'code'>('code')
  const [isResendEnabled, setIsResendEnabled] = useState(false)

  const handleEnter = useCallback((code: number) => {
    setCode(code)
  }, [])

  const handleResendComplete = useCallback(() => {
    setIsResendEnabled(true)
  }, [])

  const handleResendClick = useCallback(() => {}, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (code !== undefined) {
      timer = setTimeout(() => {
        setCodeEntered(true)
      }, 2500)
    }

    return () => clearTimeout(timer)
  }, [code])

  //NOTE: for testing purposes
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (codeEntered === true) {
      timer = setTimeout(() => {
        setVerified(false)
      }, 2000)
    }

    return () => clearTimeout(timer)
  }, [codeEntered])

  const showCode = activeInterface === 'email' || codeEntered

  return (
    <View alignItems="center" justifyContent="center" gap="$4">
      <View
        minWidth={300}
        ai="center"
        jc="center"
        borderRadius="$8"
        overflow="hidden"
        p="$5"
        borderWidth={1}
        borderColor="$borderColor"
        bg="$backgroundColor"
        //
        $gtSm={{
          shadowColor: '$shadowColor',
          shadowOffset: {
            width: 0,
            height: 12,
          },
          shadowOpacity: 0.5,
          shadowRadius: 16.0,
        }}
      >
        <View ai="center" gap="$4">
          <View w="100%">
            <Button
              unstyled
              bw={0}
              justifyContent="flex-start"
              icon={ChevronLeft}
              onPress={() => setActiveInterface('email')}
            >
              Back
            </Button>
          </View>

          <View ai="center" gap="$2" w="100%">
            <YStack gap="$2" ai="center">
              <View bg="$color4" p="$3" borderRadius="$4">
                <LockKeyhole size={32} />
              </View>
              <Text fontSize="$8" fontWeight="700">
                Verify your email
              </Text>
              <Text color="$gray10" textAlign="center">
                We sent a code to
              </Text>
              <Button
                variant="outlined"
                bw={1}
                borderColor="$borderColor"
                px="$3"
                py="$2"
                gap="$2"
                onPress={() => setActiveInterface('email')}
              >
                <Mail size={18} />
                <Text>{email ?? 'Enter Email'}</Text>
              </Button>
            </YStack>

            {!showCode && (
              <YStack w="100%" gap="$4">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  value={email ?? ''}
                />
                <Button
                  onPress={() => {
                    setActiveInterface('code')
                    setIsResendEnabled(false)
                    setVerified(true)
                    setCodeEntered(false)
                    setCode(undefined)
                  }}
                  iconAfter={<KeySquare size={18} />}
                >
                  Send OTP
                </Button>
              </YStack>
            )}

            {showCode && (
              <YStack gap="$5" w="100%">
                <View gap="$2" ai="center">
                  <Paragraph color="$color10" fontSize="$3">
                    Enter your OTP code here
                  </Paragraph>
                  <Text color="$color10" textAlign="center">
                    We will send you a code to verify your account
                  </Text>
                </View>

                <CodeConfirmation
                  size={size}
                  codeSize={codeSize}
                  secureText={secureText}
                  onEnter={handleEnter}
                />

                <ResendTimer onComplete={handleResendComplete} onResendClick={handleResendClick} />

                <Button
                  disabled={!codeEntered || !verified || !isResendEnabled}
                  onPress={() => setActiveInterface('email')}
                  iconAfter={<Smartphone size={18} />}
                >
                  Continue
                </Button>

                <View gap="$3" w="100%" ai="center">
                  <AnimatePresence>
                    {verified ? (
                      <XStack
                        key="verified"
                        ai="center"
                        gap="$2"
                        bg="$green5"
                        br="$4"
                        px="$3"
                        py="$2"
                      >
                        <CheckCircle2 size={16} color="$green10" />
                        <Paragraph color="$green10">Verified</Paragraph>
                      </XStack>
                    ) : (
                      <XStack
                        key="not-verified"
                        ai="center"
                        gap="$2"
                        bg="$red4"
                        br="$4"
                        px="$3"
                        py="$2"
                      >
                        <Spinner size="small" color="$red10" />
                        <Paragraph color="$red10">Not verified yet</Paragraph>
                      </XStack>
                    )}
                  </AnimatePresence>
                </View>
              </YStack>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
