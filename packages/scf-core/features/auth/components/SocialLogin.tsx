import { useCallback } from 'react'
import { useSocialAuthHandlers } from '../hooks/useSocialAuthHandlers'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { SocialLoginGroup } from '@scaffald/ui'
import { Platform } from 'react-native'

type SocialLoginProps = {
  /**
   * Callback invoked when the user taps a social provider without having
   * accepted the Terms checkbox. The parent surfaces the consent error
   * inline next to the checkbox (SC-65). When `undefined`, consent is
   * assumed and the social handlers run immediately.
   */
  onConsentMissing?: () => void
}

export function SocialLogin({ onConsentMissing }: SocialLoginProps) {
  const { t } = useTranslation()
  const { onGooglePress, onApplePress } = useSocialAuthHandlers()

  // SC-65: defense in depth — handlers refuse to proceed when the parent
  // signals missing consent (via the presence of the callback).
  const guardedGoogle = useCallback(() => {
    if (onConsentMissing) {
      onConsentMissing()
      return
    }
    void onGooglePress()
  }, [onConsentMissing, onGooglePress])

  const guardedApple = useCallback(() => {
    if (onConsentMissing) {
      onConsentMissing()
      return
    }
    void onApplePress()
  }, [onConsentMissing, onApplePress])

  return (
    <SocialLoginGroup
      onGooglePress={guardedGoogle}
      onApplePress={guardedApple}
      orLabel={t('common.or')}
      googleText={t('auth.login.googleButton')}
      appleText={t('auth.login.appleButton')}
      showApple={Platform.OS === 'web' || Platform.OS === 'ios'}
    />
  )
}
