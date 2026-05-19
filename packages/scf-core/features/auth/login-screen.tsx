import { ROUTES } from '@scf/core/constants/routes'
import { i18n } from '@scf/core/locales'
import { captureEvent } from '@scf/core/utils/analytics/client'
import { captureEventWithQueue } from '@scf/core/utils/analytics/queue'
import { useRequestMagicLinkMutation } from '@scf/core/utils/auth-sdk-hooks'
import { useRecordTermsAcceptanceMutation } from '@scf/core/utils/cookieConsent/useRecordConsentMutation'
import { translateError } from '@scf/core/utils/errors/translateError'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { applyZodErrorMap } from '@scf/core/utils/zodErrorMap'
import {
  Button,
  Card,
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
import { zodResolver } from '@hookform/resolvers/zod'
import type { AuthChangeEvent, Session } from '@supabase/auth-js'
import { Lock, Mail } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { Pressable, Text } from 'react-native'
import { z } from 'zod'
import { SocialLogin } from './components/SocialLogin'

applyZodErrorMap()

const POLICY_VERSION = '1'

const LoginSchema = z.object({
  // `.trim()` runs before `.email()` so autofill / copy-paste values with
  // surrounding whitespace ("user@example.com ") don't trip the resolver
  // before reaching the submit handlers' own normalization.
  email: z
    .string()
    .trim()
    .email(i18n.t('validation.email.invalid'))
    .describe(i18n.t('auth.login.emailPlaceholder')),
  password: z.string().optional(),
})

export const LoginScreen = () => {
  const renderCount = useRef(0)
  renderCount.current++
  console.log(`[LoginScreen] render #${renderCount.current}`)
  const params = useLocalSearchParams<{ email?: string }>()
  const router = useRouter()
  useRedirectAfterSignIn()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // SC-51: consent must be explicit — default to unchecked.
  const [hasAgreed, setHasAgreed] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const requestMagicLink = useRequestMagicLinkMutation()
  const { t } = useTranslation()
  const { theme } = useThemeContext()
  const textTertiary = colors.text[theme].tertiary

  // The glass card is always a warm near-white surface regardless of theme.
  // Dark-mode text tokens (light colors) fail contrast on it (~1.2:1).
  // Force light-mode dark text for all content rendered inside the card.
  const cardTextSecondary = colors.text.light.secondary   // #3c352c — 7.7:1 on glass
  const cardTextTertiary = colors.text.light.tertiary     // #6e6760 — 3.6:1 on glass
  const cardLinkColor = colors.primary[700]               // #034550 — 6.8:1 on glass

  useEffect(() => {
    console.log('[LoginScreen] params check:', JSON.stringify(params))
    if (params?.email) {
      console.log('[LoginScreen] has email param, replacing route')
      router.replace(ROUTES.AUTH.LOGIN.path)
    }
  }, [params?.email, router, params])

  const form = useForm<z.infer<typeof LoginSchema>>({
    // SC-52 + SC-59: @hookform/resolvers bumped to v3.10.0 which understands
    // Zod 4's issue shape. Resolver validates on blur and writes errors into
    // fieldState.error; we no longer need the manual safeParse() fallback
    // that the SC-52 hotfix (#256) installed.
    resolver: zodResolver(LoginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: params?.email || '',
      password: '',
    },
  })

  async function signInWithPassword(data: z.infer<typeof LoginSchema>) {
    if (!hasAgreed) return
    setIsSubmitting(true)

    const trimmedEmail = data.email?.trim()
    const password = data.password ?? ''

    if (!trimmedEmail) {
      form.setError('email', { type: 'custom', message: t('validation.email.required') })
      setIsSubmitting(false)
      return
    }
    if (!password) {
      form.setError('password', { type: 'custom', message: 'Password is required.' })
      setIsSubmitting(false)
      return
    }

    const normalizedEmail = trimmedEmail.toLowerCase()
    const emailDomain = normalizedEmail.includes('@')
      ? (normalizedEmail.split('@')[1] ?? 'unknown')
      : 'unknown'

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (error) throw error

      captureEvent('auth_password_signin_succeeded', {
        email_domain: emailDomain || null,
      })
      // useRedirectAfterSignIn handles routing on SIGNED_IN
    } catch (error) {
      const err = error as Error
      captureEvent('auth_password_signin_failed', {
        email_domain: emailDomain || null,
        message: err?.message ?? null,
      })
      form.setError('password', {
        type: 'custom',
        message: translateError(error),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

  const handleSubmit = form.handleSubmit(usePassword ? signInWithPassword : sendMagicLink)

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

        <Card variant="glass" radius="lg" elevation="md" padding="lg" style={{ width: '100%' }}>
          <Form onSubmit={handleSubmit} gap={spacing[20]}>
            <Stack gap={spacing[20]}>
              <Controller
                control={form.control}
                name="email"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <Input
                    placeholder={t('auth.login.emailPlaceholder')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    iconStart={Mail}
                    error={!!error}
                    errorMessage={error?.message}
                    disabled={!hasAgreed}
                  />
                )}
              />

              {usePassword && (
                <Controller
                  control={form.control}
                  name="password"
                  render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                    <Input
                      placeholder={t('auth.login.passwordPlaceholder')}
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="current-password"
                      iconStart={Lock}
                      error={!!error}
                      errorMessage={error?.message}
                      disabled={!hasAgreed}
                    />
                  )}
                />
              )}

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
                  ? usePassword
                    ? t('auth.login.passwordSigningIn')
                    : t('auth.login.sending')
                  : usePassword
                    ? t('auth.login.passwordSignIn')
                    : t('auth.login.submitButton')}
              </Button>

              <Pressable
                onPress={() => {
                  setUsePassword(!usePassword)
                  form.clearErrors()
                }}
                accessibilityRole="button"
                accessibilityLabel={usePassword ? t('auth.login.switchToMagicLink') : t('auth.login.switchToPassword')}
              >
                <Paragraph
                  size="sm"
                  style={{
                    color: cardLinkColor,
                    textDecorationLine: 'underline',
                    textAlign: 'center',
                  }}
                >
                  {usePassword ? t('auth.login.switchToMagicLink') : t('auth.login.switchToPassword')}
                </Paragraph>
              </Pressable>

              <SocialLogin />
              <Paragraph size="sm" style={{ color: cardTextSecondary }}>
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
                    <Paragraph size="xs" style={{ color: cardTextTertiary, flex: 1, lineHeight: 18 }}>
                      {'I agree to the '}
                      <Text
                        style={{
                          color: cardLinkColor,
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
                          color: cardLinkColor,
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
        </Card>
      </Stack>
      {/* LoadingOverlay removed: its mount/unmount cycle steals TextInput
         focus on iOS native due to full-screen absolute positioning with
         zIndex 1000 disrupting the responder chain. The login form is
         already usable while the session loads. */}
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
