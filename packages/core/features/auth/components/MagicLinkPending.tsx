import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { translateError } from '@app/core/utils/errors/translateError'
import { getBaseUrl } from '@app/core/utils/getBaseUrl'
import { supabase } from '@app/core/utils/supabase/client'
import { useTranslation } from '@app/core/utils/useTranslation'
import { CheckCircle2 } from '@tamagui/lucide-icons'
import { TRPCClientError } from '@trpc/client'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { AnimatePresence, Paragraph, Spinner, View, YStack } from 'tamagui'

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
  const requestMagicLink = api.auth.requestMagicLink.useMutation()
  const { t } = useTranslation()

  const handleEnter = useCallback(
    async (code: number) => {
      setCode(code)
      setIsSubmitting(true)
      setError(null)

      try {
        if (!email) {
          throw new Error(t('auth.verify.missingEmail'))
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
            userMessage = t('auth.verify.expired')
          } else if (error.message.includes('invalid') || error.message.includes('otp_not_found')) {
            userMessage = t('auth.verify.invalid')
          } else if (error.message.includes('too_many_requests')) {
            userMessage = t('auth.verify.throttled')
          }

          throw new Error(userMessage)
        }

        setVerified(true)
        setCodeEntered(true)
        router.push(ROUTES.AUTH.SUCCESS.path)
      } catch (err) {
        console.error('Error during OTP verification:', err)
        setError(translateError(err))
        // Reset the code and UI state on error
        setCode(undefined)
        setCodeEntered(false)
        setVerified(false)
      } finally {
        setIsSubmitting(false)
      }
    },
    [email, t]
  )

  const handleResendComplete = useCallback(() => {
    // Resend completed
  }, [])

  const handleResendClick = useCallback(async () => {
    if (!email) return

    try {
      await requestMagicLink.mutateAsync({
        email: email.trim().toLowerCase(),
        redirectTo: getBaseUrl(),
      })
    } catch (err) {
      if (err instanceof TRPCClientError) {
        setError(translateError(err))
        return
      }
      setError(translateError(err))
    }
  }, [email, requestMagicLink])

  const displayEmail = email ?? t('auth.verify.fallbackEmail')

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
        $md={{ p: '$5', minW: 300 }}
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
                    {t('auth.verify.successBanner')}
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
