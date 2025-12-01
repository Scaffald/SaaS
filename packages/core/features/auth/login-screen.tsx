import { ScaffaldLogo } from '@app/core/assets'
import { ROUTES } from '@app/core/constants/routes'
import { i18n } from '@app/core/locales'
import { captureEvent } from '@app/core/utils/analytics/client'
import { captureEventWithQueue } from '@app/core/utils/analytics/queue'
import { api } from '@app/core/utils/api'
import { translateError } from '@app/core/utils/errors/translateError'
import { supabase } from '@app/core/utils/supabase/client'
import { useTranslation } from '@app/core/utils/useTranslation'
import { useUser } from '@app/core/utils/useUser'
import { applyZodErrorMap } from '@app/core/utils/zodErrorMap'
import { Button, Form, Input, LoadingOverlay, Paragraph, YStack } from '@unicornlove/ui'
import type { AuthChangeEvent } from '@supabase/auth-js'
import { TRPCClientError } from '@trpc/client'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { SocialLogin } from './components/SocialLogin'

applyZodErrorMap()

const LoginSchema = z.object({
  email: z
    .string()
    .email(i18n.t('validation.email.invalid'))
    .describe(i18n.t('auth.login.emailPlaceholder')),
})

export const LoginScreen = () => {
  // Using supabase directly from import
  const params = useLocalSearchParams<{ email?: string }>()
  const router = useRouter()
  useRedirectAfterSignIn()
  const { isLoadingSession } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const requestMagicLink = api.auth.requestMagicLink.useMutation()
  const { t } = useTranslation()

  useEffect(() => {
    // remove the persisted email from the url, mostly to not leak user's email in case they share it
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
      // Navigate to verify screen with email
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
      <YStack gap="$4" padding="$4">
        <YStack gap="$4" marginBottom="$3" alignItems="center">
          <ScaffaldLogo width={200} height={33} />
          <YStack gap="$2" alignItems="center">
            <Paragraph textAlign="center">{t('auth.login.description')}</Paragraph>
          </YStack>
        </YStack>

        <Form onSubmit={handleSubmit}>
          <YStack gap="$4">
            <Input
              placeholder={t('auth.login.emailPlaceholder')}
              value={form.watch('email')}
              onChangeText={(text) => form.setValue('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {form.formState.errors.email && (
              <Paragraph color="$red10" fontSize="$2">
                {form.formState.errors.email.message}
              </Paragraph>
            )}

            <Button
              onPress={handleSubmit}
              disabled={isSubmitting || requestMagicLink.isPending}
              opacity={isSubmitting || requestMagicLink.isPending ? 0.5 : 1}
              backgroundColor="$blue9"
              color="$blue1"
              animation="quick"
              hoverStyle={{ scale: 1.02, backgroundColor: '$blue9' }}
              pressStyle={{ scale: 0.98 }}
            >
              {isSubmitting || requestMagicLink.isPending
                ? t('auth.login.sending')
                : t('auth.login.submitButton')}
            </Button>

            <SocialLogin />
            <Paragraph textAlign="center">{t('auth.login.socialDescription')}</Paragraph>
          </YStack>
        </Form>
      </YStack>
      {/* this is displayed when the session is being updated - usually when the user is redirected back from an auth provider */}
      {isLoadingSession && <LoadingOverlay />}
    </FormProvider>
  )
}

// we use this hook here because this is the page we redirect unauthenticated users to
// if they authenticate on this page, this will redirect them to the home page
function useRedirectAfterSignIn() {
  // Using supabase directly from import
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
