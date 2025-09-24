import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, Button, H1, isWeb, RadioGroup, Spinner, View } from 'tamagui'
import { Eye, EyeOff, Info } from '@tamagui/lucide-icons'
import { SafeAreaView } from 'react-native'

import { Input } from '../inputs/components/inputsParts'

import { FormCard } from './components/layoutParts'
import { useSignupFormState } from './useSignupFormState'
import type { SignupFormValues } from './useSignupFormState'

export function SignupValidatedHookForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { values, errors, setFieldValue, handleBlur, attemptSubmit } = useSignupFormState({
    initialValues: {
      accountType: 'business',
    },
  })

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const runSubmission = useCallback(() => {
    const { isValid } = attemptSubmit()

    if (!isValid) {
      return
    }

    setLoading(true)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setLoading(false)
      timeoutRef.current = null
    }, 2000)
  }, [attemptSubmit])

  return (
    <FormCard
      flexDirection="column"
      gap="$5"
      tag="form"
      $group-window-sm={{
        paddingHorizontal: '$4',
        paddingVertical: '$6',
      }}
    >
      <H1
        alignSelf="center"
        size="$8"
        $group-window-xs={{
          size: '$7',
        }}
      >
        Create an account
      </H1>

      <View gap="$5">
        <View
          flexWrap="wrap"
          flexDirection="row"
          justifyContent="space-between"
          columnGap="$4"
          rowGap="$5"
        >
          <Input
            {...(errors.firstName && {
              theme: 'red',
            })}
            onBlur={() => handleBlur('firstName')}
            f={1}
            minWidth="100%"
            $group-window-gtSm={{ flexBasis: 150, minWidth: 'inherit' }}
            animation="quick"
            size="$4"
          >
            <Input.Label>First Name</Input.Label>
            <Input.Box>
              <Input.Area
                placeholder="First name"
                onChangeText={(text) => setFieldValue('firstName', text)}
                value={values.firstName}
              />
            </Input.Box>
            <AnimatePresence>
              {errors.firstName && (
                <View
                  bottom="$-5"
                  left={0}
                  position="absolute"
                  gap="$2"
                  flexDirection="row"
                  animation="bouncy"
                  scaleY={1}
                  enterStyle={{
                    opacity: 0,
                    y: -10,
                    scaleY: 0.5,
                  }}
                  exitStyle={{
                    opacity: 0,
                    y: -10,
                    scaleY: 0.5,
                  }}
                >
                  <Input.Icon padding={0}>
                    <Info />
                  </Input.Icon>
                  <Input.Info>{errors.firstName}</Input.Info>
                </View>
              )}
            </AnimatePresence>
          </Input>
          <Input
            {...(errors.lastName && {
              theme: 'red',
            })}
            onBlur={() => handleBlur('lastName')}
            f={1}
            minWidth="100%"
            $group-window-gtSm={{ flexBasis: 150, minWidth: 'inherit' }}
            animation="quick"
            size="$4"
          >
            <Input.Label>Last Name</Input.Label>
            <Input.Box>
              <Input.Area
                placeholder="Last name"
                onChangeText={(text) => setFieldValue('lastName', text)}
                value={values.lastName}
              />
            </Input.Box>
            <AnimatePresence>
              {errors.lastName && (
                <View
                  bottom="$-5"
                  left={0}
                  position="absolute"
                  gap="$2"
                  flexDirection="row"
                  animation="bouncy"
                  scaleY={1}
                  enterStyle={{
                    opacity: 0,
                    y: -10,
                    scaleY: 0.5,
                  }}
                  exitStyle={{
                    opacity: 0,
                    y: -10,
                    scaleY: 0.5,
                  }}
                >
                  <Input.Icon padding={0}>
                    <Info />
                  </Input.Icon>
                  <Input.Info>{errors.lastName}</Input.Info>
                </View>
              )}
            </AnimatePresence>
          </Input>
        </View>
        <Input
          {...(errors.email && {
            theme: 'red',
          })}
          onBlur={() => handleBlur('email')}
          size="$4"
        >
          <Input.Label>Email</Input.Label>
          <Input.Box>
            <Input.Area
              placeholder="email@example.com"
              onChangeText={(text) => setFieldValue('email', text)}
              value={values.email}
            />
          </Input.Box>
          <AnimatePresence>
            {errors.email && (
              <View
                bottom="$-5"
                left={0}
                position="absolute"
                gap="$2"
                flexDirection="row"
                animation="bouncy"
                scaleY={1}
                enterStyle={{
                  opacity: 0,
                  y: -10,
                  scaleY: 0.5,
                }}
                exitStyle={{
                  opacity: 0,
                  y: -10,
                  scaleY: 0.5,
                }}
              >
                <Input.Icon padding={0}>
                  <Info />
                </Input.Icon>
                <Input.Info>{errors.email}</Input.Info>
              </View>
            )}
          </AnimatePresence>
        </Input>

        <Input
          {...(errors.password && {
            theme: 'red',
          })}
          onBlur={() => handleBlur('password')}
          size="$4"
        >
          <Input.Label htmlFor={'password-t1'}>Password</Input.Label>
          <Input.Box>
            <Input.Area
              id={'password-t1'}
              secureTextEntry={!showPassword}
              placeholder="Enter password"
              onChangeText={(text) => setFieldValue('password', text)}
              value={values.password}
            />
            <Input.Icon cursor="pointer" onPress={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <Eye color="$gray11" /> : <EyeOff color="$gray11" />}
            </Input.Icon>
          </Input.Box>
          <AnimatePresence>
            {errors.password && (
              <View
                bottom="$-5"
                left={0}
                position="absolute"
                gap="$2"
                flexDirection="row"
                animation="bouncy"
                scaleY={1}
                enterStyle={{
                  opacity: 0,
                  y: -10,
                  scaleY: 0.5,
                }}
                exitStyle={{
                  opacity: 0,
                  y: -10,
                  scaleY: 0.5,
                }}
              >
                <Input.Icon padding={0}>
                  <Info />
                </Input.Icon>
                <Input.Info>{errors.password}</Input.Info>
              </View>
            )}
          </AnimatePresence>
        </Input>

        <Input
          {...(errors.confirmedPassword && {
            theme: 'red',
          })}
          onBlur={() => handleBlur('confirmedPassword')}
          size="$4"
        >
          <Input.Label htmlFor={'confirmed password'}>Confirm Password</Input.Label>
          <Input.Box>
            <Input.Area
              id={'confirmed password'}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm password"
              onChangeText={(text) => setFieldValue('confirmedPassword', text)}
              value={values.confirmedPassword}
            />
            <Input.Icon cursor="pointer" onPress={() => setShowConfirmPassword((prev) => !prev)}>
              {showConfirmPassword ? <Eye color="$gray11" /> : <EyeOff color="$gray11" />}
            </Input.Icon>
          </Input.Box>
          <AnimatePresence>
            {errors.confirmedPassword && (
              <View
                bottom="$-5"
                left={0}
                position="absolute"
                gap="$2"
                flexDirection="row"
                animation="bouncy"
                scaleY={1}
                enterStyle={{
                  opacity: 0,
                  y: -10,
                  scaleY: 0.5,
                }}
                exitStyle={{
                  opacity: 0,
                  y: -10,
                  scaleY: 0.5,
                }}
              >
                <Input.Icon padding={0}>
                  <Info />
                </Input.Icon>
                <Input.Info>{errors.confirmedPassword}</Input.Info>
              </View>
            )}
          </AnimatePresence>
        </Input>
        <View flexDirection="column" gap="$1">
          <Input.Label htmlFor={'account-type-t1'}>Account type</Input.Label>
          <RadioGroup
            gap="$8"
            flexDirection="row"
            value={values.accountType}
            onValueChange={(value) =>
              setFieldValue('accountType', value as SignupFormValues['accountType'])
            }
            id={'account-type-t1'}
          >
            <View flexDirection="row" alignItems="center" gap="$3">
              <RadioGroup.Item id={'personal-t1'} value="personal">
                <RadioGroup.Indicator />
              </RadioGroup.Item>

              <Input.Label htmlFor={'personal-t1'}>Personal</Input.Label>
            </View>
            <View flexDirection="row" alignItems="center" gap="$3">
              <RadioGroup.Item id={'business-t1'} value="business">
                <RadioGroup.Indicator />
              </RadioGroup.Item>

              <Input.Label htmlFor={'business-t1'}>Business</Input.Label>
            </View>
          </RadioGroup>
        </View>
        <Input
          {...(errors.postalCode && {
            theme: 'red',
          })}
          onBlur={() => handleBlur('postalCode')}
          size="$4"
        >
          <Input.Label>Postal code</Input.Label>
          <Input.Box>
            <Input.Area
              keyboardType="decimal-pad"
              textContentType="postalCode"
              placeholder="Postal code"
              onChangeText={(text) => setFieldValue('postalCode', text)}
              value={values.postalCode}
            />
          </Input.Box>
          <AnimatePresence>
            {errors.postalCode && (
              <View
                bottom="$-5"
                left={0}
                position="absolute"
                gap="$2"
                flexDirection="row"
                animation="bouncy"
                scaleY={1}
                enterStyle={{
                  opacity: 0,
                  y: -10,
                  scaleY: 0.5,
                }}
                exitStyle={{
                  opacity: 0,
                  y: -10,
                  scaleY: 0.5,
                }}
              >
                <Input.Icon padding={0}>
                  <Info />
                </Input.Icon>
                <Input.Info>{errors.postalCode}</Input.Info>
              </View>
            )}
          </AnimatePresence>
        </Input>
        <Button
          themeInverse
          disabled={loading}
          onPress={runSubmission}
          cursor={loading ? 'progress' : 'pointer'}
          alignSelf="flex-end"
          w="100%"
          iconAfter={
            <AnimatePresence>
              {loading && (
                <Spinner
                  size="small"
                  color="$color"
                  key="loading-spinner"
                  opacity={1}
                  position="absolute"
                  scale={0.5}
                  left={110}
                  animation="quick"
                  enterStyle={{
                    opacity: 0,
                    scale: 0.5,
                  }}
                  exitStyle={{
                    opacity: 0,
                    scale: 0.5,
                  }}
                />
              )}
            </AnimatePresence>
          }
        >
          Sign Up
        </Button>
      </View>
      {!isWeb && <SafeAreaView />}
    </FormCard>
  )
}

SignupValidatedHookForm.fileName = 'SignupValidatedHookForm'
