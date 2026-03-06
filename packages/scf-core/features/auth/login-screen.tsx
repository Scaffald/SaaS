import { ROUTES } from '@scf/core/constants/routes'
import { i18n } from '@scf/core/locales'
import { captureEvent } from '@scf/core/utils/analytics/client'
import { captureEventWithQueue } from '@scf/core/utils/analytics/queue'
import { useRequestMagicLinkMutation } from '@scf/core/utils/auth-sdk-hooks'
import { useRecordTermsAcceptanceMutation } from '@scf/core/utils/cookieConsent/useRecordConsentMutation'
import { translateError } from '@scf/core/utils/errors/translateError'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { useUser } from '@scf/core/utils/useUser'
import { applyZodErrorMap } from '@scf/core/utils/zodErrorMap'
import {
  Button,
  Checkbox,
  Form,
  H5,
  Input,
  Paragraph,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'
import type { AuthChangeEvent, Session } from '@supabase/auth-js'
import { Mail } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Pressable, Text } from 'react-native'
import { z } from 'zod'
import { LoadingOverlay } from '@scaffald/ui'
import { SocialLogin } from './components/SocialLogin'

applyZodErrorMap()

const POLICY_VERSION = '1'

const LoginSchema = z.object({
  email: z
    .string()
    .email(i18n.t('validation.email.invalid'))
    .describe(i18n.t('auth.login.emailPlaceholder')),
})

export const LoginScreen = () => {
  const params = useLocalSearchParams<{ email?: string }>()
  const router = useRouter()
  useRedirectAfterSignIn()
  const { isLoadingSession } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasAgreed, setHasAgreed] = useState(true)
  const requestMagicLink = useRequestMagicLinkMutation()
  const { t } = useTranslation()
  const { theme } = useThemeContext()
  const textTertiary = colors.text[theme].tertiary
  const textSecondary = colors.text[theme].secondary
  const linkColor = colors.primary[700]

  useEffect(() => {
    if (params?.email) {
      router.replace(ROUTES.AUTH.LOGIN.path)
    }
  }, [params?.email, router])

  const form = useForm<z.infer<typeof LoginSchema>>({
    defaultValues: {
      email: params?.email || '',
    },
  })

  async function sendMagicLink(data: z.infer<typeof LoginSchema>) {
    if (!hasAgreed) return
    setIsSubmitting(true)

    const trimmedEmail = data.email?.trim()

    if (!trimmedEmail) {
      form.setError('email', { type: 'custom', message: t('validation.email.required') })
      setIsSubmitting(false)
      return
    }

    const normalizedEmail = trimmedEmail.toLowerCase()
    const emailDomain = normalizedEmail.includes('@')
      ? (normalizedEmail.split('@')[1] ?? 'unknown')
      : 'unknown'

    try {
      const redirectTo = process.env.EXPO_PUBLIC_URL

      const result = await requestMagicLink.mutateAsync({
        email: normalizedEmail,
        redirectTo,
      })

      await captureEventWithQueue('auth_magic_link_requested', {
        email_domain: emailDomain,
        mode: result?.mode ?? null,
      })

      router.push({
        pathname: ROUTES.AUTH.VERIFY.path,
        params: { email: normalizedEmail, mode: result?.mode },
      })
    } catch (error) {
      const err = error as Error & { data?: { code?: string } }
      const errorMessage = err?.message ?? 'Unknown error'
      const errorCode = err?.data?.code ?? err?.name ?? 'unknown'

      captureEvent('auth_magic_link_failed', {
        email_domain: emailDomain || null,
        error_code: errorCode ?? null,
        message: errorMessage ?? null,
      })

      form.setError('email', {
        type: 'custom',
        message: translateError(error),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = form.handleSubmit(sendMagicLink)

  return (
    <FormProvider {...form}>
      <Stack
        gap={spacing[20]}
        padding={spacing[20]}
        align="center"
        style={{ width: '100%', maxWidth: 440 }}
      >
        <Stack gap={spacing[8]} align="flex-start" style={{ width: '100%' }}>
          <H5
            serif
            weight="regular"
            style={{
              color: colors.text[theme].primary,
              fontFamily: 'RobotoSerif_400Regular',
            }}
          >
            {t('auth.login.title')}
          </H5>
          <Paragraph size="sm" style={{ color: textTertiary }}>
            {t('auth.login.description')}
          </Paragraph>
        </Stack>

        <Form onSubmit={handleSubmit} gap={spacing[20]}>
          <Stack gap={spacing[20]}>
            <Input
              placeholder={t('auth.login.emailPlaceholder')}
              value={form.watch('email')}
              onChangeText={(text) => form.setValue('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              iconStart={Mail}
              error={!!form.formState.errors.email}
              errorMessage={form.formState.errors.email?.message}
              disabled={!hasAgreed}
            />

            <Button
              onPress={handleSubmit}
              disabled={!hasAgreed || isSubmitting || requestMagicLink.isPending}
              color="primary"
              variant="filled"
              style={{
                alignSelf: 'stretch',
                opacity: !hasAgreed || isSubmitting || requestMagicLink.isPending ? 0.5 : 1,
              }}
            >
              {isSubmitting || requestMagicLink.isPending
                ? t('auth.login.sending')
                : t('auth.login.submitButton')}
            </Button>

            <SocialLogin />
            <Paragraph size="sm" style={{ color: textSecondary }}>
              {t('auth.login.socialDescription')}
            </Paragraph>

            {/* Legal consent checkbox */}
            <Stack gap={spacing[4]}>
              <Pressable onPress={() => setHasAgreed(!hasAgreed)}>
                <Row gap={spacing[10]} align="center">
                  <Checkbox
                    checked={hasAgreed}
                    onChange={setHasAgreed}
                  />
                  <Paragraph size="xs" style={{ color: textTertiary, flex: 1, lineHeight: 18 }}>
                    {'I agree to the '}
                    <Text
                      style={{
                        color: linkColor,
                        textDecorationLine: 'underline',
                        fontSize: 12,
                        lineHeight: 18,
                      }}
                      onPress={() => router.push(ROUTES.AUTH.TERMS.path)}
                    >
                      Terms of Service
                    </Text>
                    {' and '}
                    <Text
                      style={{
                        color: linkColor,
                        textDecorationLine: 'underline',
                        fontSize: 12,
                        lineHeight: 18,
                      }}
                      onPress={() => router.push(ROUTES.AUTH.PRIVACY.path)}
                    >
                      Privacy Policy
                    </Text>
                    {', and acknowledge the use of cookies.'}
                  </Paragraph>
                </Row>
              </Pressable>
              {!hasAgreed && (
                <Paragraph size="xs" style={{ color: colors.fg.light.error }}>
                  You must agree to the Terms and Privacy Policy to continue.
                </Paragraph>
              )}
            </Stack>
          </Stack>
        </Form>
      </Stack>
      {isLoadingSession && <LoadingOverlay />}
    </FormProvider>
  )
}

function useRedirectAfterSignIn() {
  const router = useRouter()
  const { mutate: recordTerms } = useRecordTermsAcceptanceMutation()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN') {
          if (session?.user?.id) {
            recordTerms({ userId: session.user.id, policyVersion: POLICY_VERSION })
          }
          router.replace(ROUTES.HOME.path)
        }
      }
    )
    return () => {
      subscription.unsubscribe()
    }
  }, [router, recordTerms])
}
