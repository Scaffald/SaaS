import { useSocialAuthHandlers } from '../hooks/useSocialAuthHandlers'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { SocialLoginGroup } from '@scaffald/ui'
import { Platform } from 'react-native'

export function SocialLogin() {
  const { t } = useTranslation()
  const { onGooglePress, onApplePress } = useSocialAuthHandlers()

  return (
    <SocialLoginGroup
      onGooglePress={() => void onGooglePress()}
      onApplePress={() => void onApplePress()}
      orLabel={t('common.or')}
      googleText={t('auth.login.googleButton')}
      appleText={t('auth.login.appleButton')}
      showApple={Platform.OS === 'web' || Platform.OS === 'ios'}
    />
  )
}
