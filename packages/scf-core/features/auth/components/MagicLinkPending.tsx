import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { translateError } from '@scf/core/utils/errors/translateError'
import { getBaseUrl } from '@scf/core/utils/getBaseUrl'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { CheckCircle2 } from 'lucide-react-native'
import { TRPCClientError } from '@trpc/client'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { Box, Paragraph, Spinner, Stack, useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
  const { theme } = useThemeContext()

  const handleEnter = useCallback(
    async (enteredCode: number) => {
      setCode(enteredCode)
      setIsSubmitting(true)
      setError(null)

      try {
        if (!email) {
          throw new Error(t('auth.verify.missingEmail'))
        }

        const { error } = await supabase.auth.verifyOtp({
          email,
          token: enteredCode.toString(),
          type: 'email',
        })

        if (error) {
          console.error('OTP verification error:', error)
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
        setCode(undefined)
        setCodeEntered(false)
        setVerified(false)
      } finally {
        setIsSubmitting(false)
      }
    },
    [email, t]
  )

  const handleResendComplete = useCallback(() => {}, [])

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
    <Box flex={1} align="center" justify="center" padding="md" style={{ width: '100%' }}>
      <Box
        style={{
          borderWidth: 1,
          borderColor: colors.border.light.default,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          overflow: 'hidden',
          padding: 16,
          paddingHorizontal: 12,
          minWidth: 300,
          width: '100%',
          maxWidth: 450,
        }}
      >
        {codeEntered && (
          <Box style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {verified && (
              <Paragraph style={{ color: colors.text[theme].success }}>
                {t('auth.verify.successBanner')}
              </Paragraph>
            )}
            <CheckCircle2 size={24} color={colors.icon[theme].success} />
          </Box>
        )}

        <Box
          key="code"
          style={{
            opacity: codeEntered ? 0 : 1,
            pointerEvents: codeEntered ? 'none' : 'auto',
            transform: [{ translateX: codeEntered ? -150 : 0 }],
            width: '100%',
          }}
        >
          <Stack
            justify="space-between"
            gap={16}
            style={{ opacity: code !== undefined ? 0 : 1, width: '100%' }}
          >
            <EmailHeader email={displayEmail} />

            <Box style={{ width: '100%' }}>
              <CodeConfirmation codeSize={6} secureText={false} onEnter={handleEnter} />

              <ResendTimer onComplete={handleResendComplete} onResendClick={handleResendClick} />
            </Box>

            {error && (
              <Paragraph
                style={{ color: colors.text[theme].error, textAlign: 'center', fontSize: 14 }}
              >
                {error}
              </Paragraph>
            )}
          </Stack>

          {code !== undefined && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              align="center"
              justify="center"
              style={{
                backgroundColor: colors.bg[theme].default,
                color: colors.icon[theme].secondary,
              }}
            >
              <Spinner />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
