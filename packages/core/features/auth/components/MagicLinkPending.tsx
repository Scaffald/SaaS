import { useCallback, useState } from 'react'
import { AnimatePresence, Paragraph, Spinner, View, YStack } from 'tamagui'
import { CheckCircle2 } from '@tamagui/lucide-icons'
import { supabase } from '@app/core/utils/supabase/client'
import { getBaseUrl } from '@app/core/utils/getBaseUrl'
import { router } from 'expo-router'

import { CodeConfirmation } from './CodeConfirmation'
import { EmailHeader } from './EmailHeader'
import { ResendTimer } from './ResendTimer'

type MagicLinkPendingProps = {
  email?: string
}

export const MagicLinkPending = ({ email }: MagicLinkPendingProps) => {
  const [code, setCode] = useState<number>()
  const [codeEntered, setCodeEntered] = useState(false)
  const [verified, setVerified] = useState(false)
  const [_isSubmitting, setIsSubmitting] = useState(false)
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

        setVerified(true)
        setCodeEntered(true)
        router.push('/auth/success')
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
    [email]
  )

  const handleResendComplete = useCallback(() => {
    // Resend completed
  }, [])

  const handleResendClick = useCallback(async () => {
    if (!email) return

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getBaseUrl(),
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    }
  }, [email])

  const displayEmail = email ?? 'your email address'

  return (
    <View flex={1} items="center" justify="center" p="$4" width="100%">
      <View
        borderWidth="$1"
        borderColor="$borderColor"
        items="center"
        justify="center"
        rounded="$8"
        overflow="hidden"
        p="$4"
        px="$3"
        $gtSm={{ p: '$5', minW: 300 }}
        width="100%"
        maxW={450}
      >
        <View r="$4">
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
          ) : null}
        </View>

        <View
          key="code"
          animation="200ms"
          opacity={codeEntered ? 0 : 1}
          style={{ pointerEvents: codeEntered ? 'none' : 'auto' }}
          transform={[{ translateX: codeEntered ? -150 : 0 }]}
        >
          <YStack
            key="code"
            animation="200ms"
            exitStyle={{ opacity: 0 }}
            justify="space-between"
            gap="$4"
            opacity={code ? 0 : 1}
          >
            <EmailHeader email={displayEmail} />

            <View width="100%">
              <CodeConfirmation size="$5" codeSize={6} secureText={false} onEnter={handleEnter} />

              <ResendTimer onComplete={handleResendComplete} onResendClick={handleResendClick} />
            </View>

            {error && (
              <Paragraph color="$red10" text="center" fontSize="$2">
                {error}
              </Paragraph>
            )}
          </YStack>

          {code ? (
            <View
              position="absolute"
              width="100%"
              height="100%"
              items="center"
              justify="center"
              bg="$background"
            >
              <Spinner color="$color10" />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}
