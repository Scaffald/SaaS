import { useCallback } from 'react'
import { useSocialAuthHandlers } from '../hooks/useSocialAuthHandlers'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { SocialLoginGroup, useToast } from '@scaffald/ui'
import { Platform } from 'react-native'

type SocialLoginProps = {
  /**
   * When false, the buttons are disabled. SC-51 / SC-60: social auth must be
   * gated on terms acceptance just like the password and magic-link flows.
   */
  hasAgreed: boolean
}

export function SocialLogin({ hasAgreed }: SocialLoginProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const { onGooglePress, onApplePress } = useSocialAuthHandlers()

  // Defense in depth: even if a caller forgets to gate the UI, the handlers
  // refuse to proceed without consent.
  const guardedGoogle = useCallback(() => {
    if (!hasAgreed) {
      toast.show({
        message: t('auth.errors.mustAcceptTerms'),
        variant: 'error',
        duration: 4000,
      })
      return
    }
    void onGooglePress()
  }, [hasAgreed, onGooglePress, toast, t])

  const guardedApple = useCallback(() => {
    if (!hasAgreed) {
      toast.show({
        message: t('auth.errors.mustAcceptTerms'),
        variant: 'error',
        duration: 4000,
      })
      return
    }
    void onApplePress()
  }, [hasAgreed, onApplePress, toast, t])

  return (
    <SocialLoginGroup
      onGooglePress={guardedGoogle}
      onApplePress={guardedApple}
      orLabel={t('common.or')}
      googleText={t('auth.login.googleButton')}
      appleText={t('auth.login.appleButton')}
      showApple={Platform.OS === 'web' || Platform.OS === 'ios'}
      disabled={!hasAgreed}
    />
  )
}
