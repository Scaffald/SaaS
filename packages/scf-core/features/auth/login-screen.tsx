import { ScaffaldLogo } from '@scf/core/assets'
import { ROUTES } from '@scf/core/constants/routes'
import { i18n } from '@scf/core/locales'
import { captureEvent } from '@scf/core/utils/analytics/client'
import { captureEventWithQueue } from '@scf/core/utils/analytics/queue'
import { api } from '@scf/core/utils/api'
import { translateError } from '@scf/core/utils/errors/translateError'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { useUser } from '@scf/core/utils/useUser'
import { applyZodErrorMap } from '@scf/core/utils/zodErrorMap'
import { Button, Card, Form, H5, Input, Paragraph, Stack, useThemeContext } from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'
import type { AuthChangeEvent } from '@supabase/auth-js'
import { TRPCClientError } from '@trpc/client'
import { Mail } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { LoadingOverlay } from '@scaffald/ui'
import { SocialLogin } from './components/SocialLogin'

applyZodErrorMap()

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
  const requestMagicLink = api.auth.requestMagicLink.useMutation()
  const { t } = useTranslation()
  const { theme } = useThemeContext()
  const textSecondary = colors.text[theme].secondary
  const textTertiary = colors.text[theme].tertiary

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
    console.log('Sending magic link for:', data.email)
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

      console.log('Magic link sent successfully!')
      router.push({
        pathname: ROUTES.AUTH.VERIFY.path,
        params: { email: normalizedEmail, mode: result?.mode },
      })
    } catch (error) {
      console.error('Error sending magic link:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorCode =
        error instanceof TRPCClientError
          ? (error.data?.code ?? error.name)
          : error instanceof Error
            ? error.name
            : 'unknown'

      captureEvent('auth_magic_link_failed', {
        email_domain: emailDomain || null,
        error_code: errorCode ?? null,
        message: errorMessage ?? null,
      })

      if (error instanceof TRPCClientError) {
        form.setError('email', {
          type: 'custom',
          message: translateError(error),
        })
        return
      }
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
        <Card variant="elevated" radius="lg" elevation="md" padding="lg" style={{ width: '100%' }}>
          <Stack gap={spacing[20]} align="center">
            <ScaffaldLogo width={200} height={33} />
            <Stack gap={spacing[2]} align="center">
              <H5
                serif
                weight="regular"
                align="center"
                style={{
                  color: colors.text[theme].primary,
                  fontFamily: 'RobotoSerif_400Regular',
                }}
              >
                {t('auth.login.title')}
              </H5>
              <Paragraph size="sm" style={{ textAlign: 'center', color: textSecondary }}>
                {t('auth.login.description')}
              </Paragraph>
            </Stack>
          </Stack>

          <Form onSubmit={handleSubmit} gap={spacing[20]}>
            <Stack gap={spacing[20]}>
              <Input
                label={t('auth.login.emailLabel')}
                placeholder={t('auth.login.emailPlaceholder')}
                value={form.watch('email')}
                onChangeText={(text) => form.setValue('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                iconStart={Mail}
                error={!!form.formState.errors.email}
                errorMessage={form.formState.errors.email?.message}
              />

              <Button
                onPress={handleSubmit}
                disabled={isSubmitting || requestMagicLink.isPending}
                color="primary"
                variant="filled"
                style={{
                  alignSelf: 'stretch',
                  opacity: isSubmitting || requestMagicLink.isPending ? 0.5 : 1,
                }}
              >
                {isSubmitting || requestMagicLink.isPending
                  ? t('auth.login.sending')
                  : t('auth.login.submitButton')}
              </Button>

              <SocialLogin />
              <Paragraph size="sm" style={{ textAlign: 'center', color: textTertiary }}>
                {t('auth.login.socialDescription')}
              </Paragraph>
            </Stack>
          </Form>
        </Card>
      </Stack>
      {isLoadingSession && <LoadingOverlay />}
    </FormProvider>
  )
}

function useRedirectAfterSignIn() {
  const router = useRouter()
  useEffect(() => {
    const signOutListener = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'SIGNED_IN') {
        router.replace(ROUTES.HOME.path)
      }
    })
    return () => {
      signOutListener.data.subscription.unsubscribe()
    }
  }, [router])
}
