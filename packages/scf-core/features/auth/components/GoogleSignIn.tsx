import { captureEvent } from '@scf/core/utils/analytics/client'
import { supabase } from '@scf/core/utils/supabase/client'
import { useTranslation } from '@scf/core/utils/useTranslation'
import { Button, Theme, useToastController } from '@unicornlove/ui'
import { logger } from '@scf/core'

import { IconGoogle } from './IconGoogle'

export function GoogleSignIn() {
  // Using supabase directly from import
  const { t } = useTranslation()
  const toast = useToastController()
  const handleOAuthSignIn = async () => {
    captureEvent('auth_social_sign_in_started', { provider: 'google' })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.EXPO_PUBLIC_URL,
      },
    })
    if (error) {
      logger.error('Google Sign-In Error', error, { provider: 'google' })
      captureEvent('auth_social_sign_in_failed', {
        provider: 'google',
        error_code: error.name ?? null,
        message: error.message ?? null,
      })
      toast.show(t('auth.errors.googleSignInFailed'), {
        type: 'error',
        duration: 5000,
      })
    }
  }

  return (
    <Theme inverse>
      <Button
        borderRadius="$10"
        flex={1}
        backgroundColor="$background"
        color="$color"
        borderColor="$borderColor"
        animation="quick"
        hoverStyle={{ scale: 1.02, backgroundColor: '$background' }}
        pressStyle={{ scale: 0.98 }}
        onPress={() => handleOAuthSignIn()}
        icon={IconGoogle}
      >
        {t('auth.login.googleButton')}
      </Button>
    </Theme>
  )
}
