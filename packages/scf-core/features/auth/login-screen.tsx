import { ROUTES } from '@scf/core/constants/routes'
import { i18n } from '@scf/core/locales'
import { captureEvent } from '@scf/core/utils/analytics/client'
import { captureEventWithQueue } from '@scf/core/utils/analytics/queue'
import { useRequestMagicLinkMutation } from '@scf/core/utils/auth-sdk-hooks'
import { translateError } from '@scf/core/utils/errors/translateError'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { applyZodErrorMap } from '@scf/core/utils/zodErrorMap'
import {
  Button,
  Form,
  Input,
  Paragraph,
  SegmentedControl,
  Stack,
  useThemeContext,
  useToast,
} from '@scaffald/ui'
import { colors, fontScale, spacing } from '@scaffald/ui/tokens'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AuthChangeEvent, Session } from '@supabase/auth-js'
import { Lock, Mail } from 'lucide-react-native'
import { type Href, Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Controller, FormProvider, type Resolver, useForm } from 'react-hook-form'
import { Platform, Pressable, Text, type TextStyle } from 'react-native'
import { z } from 'zod'
import {
  AUTH_MODES,
  type AuthMode,
  canUsePassword,
  initialAuthMode,
  modeDescriptionKey,
  primaryActionKey,
} from './auth-entry'
import { IntentBanner } from './components/IntentBanner'
import { SocialLogin } from './components/SocialLogin'

applyZodErrorMap()

const LoginSchema = z.object({
  // `.trim()` first so autofill / copy-paste values with surrounding whitespace
  // ("user@example.com ") don't trip validation.
  // `.min(1, required)` before `.email()` so an empty submit reports
  // "Email is required" rather than the generic "invalid email" message —
  // the resolver runs each rule in order and surfaces the first failure.
  email: z
    .string()
    .trim()
    .min(1, i18n.t('validation.email.required'))
    .email(i18n.t('validation.email.invalid'))
    .describe(i18n.t('auth.login.emailPlaceholder')),
  password: z.string().optional(),
})

export const LoginScreen = () => {
  const params = useLocalSearchParams<{
    email?: string
    oauth_error?: string
    oauth_error_code?: string
    oauth_error_description?: string
    intent?: string
  }>()
  const router = useRouter()
  useRedirectAfterSignIn()
  useSurfaceOAuthCallbackError(params)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  // Sign in / Create account (#1210). Read once: the URL is rewritten below
  // when an `email` param is stripped, and the tab must not jump back then.
  const [mode, setMode] = useState<AuthMode>(() => initialAuthMode(params ?? {}))
  const requestMagicLink = useRequestMagicLinkMutation()
  const { t } = useTranslation()
  const { theme } = useThemeContext()

  // The card is now the page's own surface (AuthCard), not a fixed
  // near-white glass panel, so the text follows the theme.
  const textSecondary = colors.text[theme].secondary
  const textTertiary = colors.text[theme].tertiary
  const linkColor = colors.text[theme].emphasis
  const fieldLabelStyle: TextStyle = {
    fontSize: fontScale.step1,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: textTertiary,
  }
  const passwordOffered = canUsePassword(mode)
  const passwordActive = usePassword && passwordOffered

  const selectMode = (next: AuthMode) => {
    setMode(next)
    if (!canUsePassword(next)) setUsePassword(false)
    form.clearErrors()
  }

  useEffect(() => {
    if (params?.email) {
      router.replace(ROUTES.AUTH.LOGIN.path)
    }
  }, [params?.email, router, params])

  type LoginValues = z.infer<typeof LoginSchema>
  const form = useForm<LoginValues>({
    // SC-59: resolver is back. @hookform/resolvers was bumped to v5.2.2
    // which understands Zod 4's issue shape. Cast is required because
    // v5's Resolver<TInput, TCtx, TOutput> derives TInput from the
    // schema's strict input — our form values type matches the schema
    // output at runtime so this is safe.
    resolver: zodResolver(LoginSchema) as unknown as Resolver<LoginValues>,
    mode: 'onBlur',
    defaultValues: {
      email: params?.email || '',
      password: '',
    },
  })

  async function signInWithPassword(data: z.infer<typeof LoginSchema>) {
    setIsSubmitting(true)

    // Email required/format validation runs in the resolver before this is
    // called, so by the time we're here `data.email` is a non-empty,
    // trimmed, valid address.
    const normalizedEmail = data.email.toLowerCase()
    const password = data.password ?? ''

    if (!password) {
      form.setError('password', { type: 'custom', message: 'Password is required.' })
      setIsSubmitting(false)
      return
    }
    const emailDomain = normalizedEmail.split('@')[1] ?? 'unknown'

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
    setIsSubmitting(true)

    // Resolver guarantees data.email is non-empty, trimmed, and valid.
    const normalizedEmail = data.email.toLowerCase()
    const emailDomain = normalizedEmail.split('@')[1] ?? 'unknown'

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

  // Sign-in is not gated on a consent checkbox anymore. The passive legal
  // notice below the form is browsewrap; the actual clickwrap acceptance
  // (versioned, audited) happens in onboarding / the /legal-update screen.
  // Both tabs send the same magic link; only Sign in offers the password.
  const handleSubmit = form.handleSubmit(passwordActive ? signInWithPassword : sendMagicLink)
  const pending = isSubmitting || requestMagicLink.isPending

  const linkStyle: TextStyle = {
    color: linkColor,
    textDecorationLine: 'underline',
    textAlign: 'center',
  }

  return (
    <FormProvider {...form}>
      <Stack gap={spacing[16]} style={{ width: '100%' }}>
        {/* The prototype's Sign in / Create account switch (#1210). It sets
            what the card says and which extra paths it offers; the email
            link underneath signs a known address in and makes an account
            for a new one either way. */}
        <SegmentedControl
          segments={AUTH_MODES.map((m) =>
            m === 'create' ? t('auth.login.modeCreate') : t('auth.login.modeSignIn')
          )}
          selectedIndex={AUTH_MODES.indexOf(mode)}
          onSelectionChange={(i) => selectMode(AUTH_MODES[i] ?? 'signin')}
          testID="auth-mode"
        />

        <IntentBanner />

        <Paragraph size="sm" style={{ color: textSecondary }}>
          {t(modeDescriptionKey(mode))}
        </Paragraph>

        <Form onSubmit={handleSubmit} gap={spacing[16]}>
          <Stack gap={spacing[16]}>
            <Controller
              control={form.control}
              name="email"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <Input
                  label={t('auth.login.emailLabel')}
                  labelStyle={fieldLabelStyle}
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
                />
              )}
            />

            {passwordActive && (
              <Controller
                control={form.control}
                name="password"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <Input
                    label={t('auth.login.passwordLabel')}
                    labelStyle={fieldLabelStyle}
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
                  />
                )}
              />
            )}

            <Button
              onPress={handleSubmit}
              disabled={pending}
              color="primary"
              variant="filled"
              style={{
                alignSelf: 'stretch',
                opacity: pending ? 0.5 : 1,
              }}
            >
              {t(primaryActionKey(mode, usePassword, pending))}
            </Button>

            {passwordOffered && (
              <Pressable
                onPress={() => {
                  setUsePassword(!usePassword)
                  form.clearErrors()
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  usePassword ? t('auth.login.switchToMagicLink') : t('auth.login.switchToPassword')
                }
              >
                <Paragraph size="sm" style={linkStyle}>
                  {usePassword
                    ? t('auth.login.switchToMagicLink')
                    : t('auth.login.switchToPassword')}
                </Paragraph>
              </Pressable>
            )}

            {/* SC-66: cross-device OTP entry. Routes to /auth/verify with
                no email param; MagicLinkPending renders an inline email
                Input + uses it for verifyOtp. */}
            {passwordOffered && (
              <Pressable
                onPress={() => router.push(ROUTES.AUTH.VERIFY.path)}
                accessibilityRole="link"
                accessibilityLabel={t('auth.login.useOneTimeCode')}
              >
                <Paragraph size="sm" style={linkStyle}>
                  {t('auth.login.useOneTimeCode')}
                </Paragraph>
              </Pressable>
            )}

            <SocialLogin />
            <Paragraph size="xs" style={{ color: textTertiary, lineHeight: 18 }}>
              {t('auth.login.socialDescription')}
            </Paragraph>

            {/* Passive legal notice (browsewrap). The versioned clickwrap
                acceptance lives in onboarding and the /legal-update screen;
                cookies are handled by the cookie banner. */}
            <Paragraph
              size="xs"
              testID="login-legal-notice"
              style={{ color: textTertiary, lineHeight: 18, textAlign: 'center' }}
            >
              {t('auth.login.legalNotice.prefix')}
              <Text
                style={{
                  color: linkColor,
                  textDecorationLine: 'underline',
                  fontSize: 12,
                  lineHeight: 18,
                }}
                onPress={() => router.push(ROUTES.LEGAL.TERMS.path)}
              >
                {t('auth.login.legalNotice.terms')}
              </Text>
              {t('auth.login.legalNotice.and')}
              <Text
                style={{
                  color: linkColor,
                  textDecorationLine: 'underline',
                  fontSize: 12,
                  lineHeight: 18,
                }}
                onPress={() => router.push(ROUTES.LEGAL.PRIVACY.path)}
              >
                {t('auth.login.legalNotice.privacy')}
              </Text>
              {t('auth.login.legalNotice.suffix')}
            </Paragraph>

            {/* The prototype's footer line (#1210). Its "Workers stay
                anonymous until they accept contact" is not true today — an
                employer sees a worker's name — so the line promises only what
                the product keeps: contact details stay private. The way back
                to the marketing site is a web affordance; the native app has
                no site to return to. */}
            <Paragraph
              size="xs"
              testID="login-privacy-notice"
              style={{ color: textTertiary, lineHeight: 18, textAlign: 'center' }}
            >
              {t('auth.login.privacyNotice')}
              {Platform.OS === 'web' ? (
                <>
                  {' '}
                  <Link
                    href={ROUTES.HOME.path as Href}
                    style={{ color: linkColor, textDecorationLine: 'underline' }}
                  >
                    {t('auth.login.backToSite')}
                  </Link>
                </>
              ) : null}
            </Paragraph>
          </Stack>
        </Form>
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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, _session: Session | null) => {
      if (event === 'SIGNED_IN') {
        router.replace(ROUTES.HOME.path)
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [router])
}

/**
 * SC-60: When the OAuth callback redirects here with error params, show a
 * toast and strip the params from the URL so the user gets a clear signal
 * and a clean state for retry.
 */
function useSurfaceOAuthCallbackError(params: {
  oauth_error?: string
  oauth_error_code?: string
  oauth_error_description?: string
}) {
  const toast = useToast()
  const router = useRouter()
  const { t } = useTranslation()
  const shownRef = useRef(false)

  const error = params?.oauth_error
  const errorCode = params?.oauth_error_code
  const errorDescription = params?.oauth_error_description

  useEffect(() => {
    if (shownRef.current) return
    if (!error && !errorCode && !errorDescription) return
    shownRef.current = true

    const reason = (errorDescription || errorCode || error || '').trim()
    const message = reason
      ? t('auth.errors.oauthCallbackErrorWithReason', { reason })
      : t('auth.errors.oauthCallbackError')

    toast.show({ message, variant: 'error', duration: 6000 })
    captureEvent('auth_callback_error_surfaced', {
      error: error ?? null,
      error_code: errorCode ?? null,
      error_description: errorDescription ?? null,
    })

    // Clean the URL so a refresh doesn't replay the toast.
    router.replace(ROUTES.AUTH.LOGIN.path)
  }, [error, errorCode, errorDescription, toast, router, t])
}
