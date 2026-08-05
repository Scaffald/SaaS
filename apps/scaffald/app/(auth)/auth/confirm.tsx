import { supabase } from '@scf/core/utils/supabase/client'
import { ROUTES } from '@scf/core/constants/routes'
import { captureEvent } from '@scf/core/utils/analytics/client'
import type { EmailOtpType } from '@supabase/auth-js'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'

const VALID_OTP_TYPES: EmailOtpType[] = [
  'email',
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
]

/**
 * Email-link confirmation lander (`/auth/confirm?token_hash=...&type=...`).
 *
 * The email templates link here with a `token_hash` instead of GoTrue's
 * `{{ .ConfirmationURL }}`. verifyOtp({ token_hash }) works identically under
 * the implicit AND pkce client flows — which is what makes the web PKCE
 * switch safe: a GoTrue /verify redirect would land with an implicit-style
 * `#access_token` fragment that a pkce-configured client rejects (and worse,
 * `_removeSession`s any existing session on the way out).
 *
 * Failure forwards to the login screen's oauth_error toast plumbing (SC-60).
 */
export default function ConfirmScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ token_hash?: string; type?: string }>()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    const tokenHash = typeof params.token_hash === 'string' ? params.token_hash : undefined
    const type = VALID_OTP_TYPES.includes(params.type as EmailOtpType)
      ? (params.type as EmailOtpType)
      : 'email'

    if (!tokenHash) {
      router.replace(ROUTES.AUTH.LOGIN.path)
      return
    }
    startedRef.current = true

    const verify = async () => {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (error) {
        captureEvent('auth_email_confirm_failed', {
          error_code: error.name ?? null,
          message: error.message ?? null,
          otp_type: type,
        })
        router.replace({
          pathname: ROUTES.AUTH.LOGIN.path,
          params: {
            oauth_error: 'email_link_error',
            oauth_error_description: error.message ?? '',
          },
        })
        return
      }
      captureEvent('auth_email_confirm_succeeded', { otp_type: type })
      router.replace(ROUTES.HOME.path)
    }
    void verify()
  }, [params.token_hash, params.type, router])

  return null
}
