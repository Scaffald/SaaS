import { useTranslation } from '@app/core/utils/useTranslation'
import { isWeb, Separator, SizableText, XStack, YStack } from '@unicornlove/ui'

import { AppleSignIn } from './AppleSignIn'
import { GoogleSignIn } from './GoogleSignIn'

export function SocialLogin() {
  const Stack = isWeb ? XStack : YStack
  const { t } = useTranslation()

  return (
    <YStack gap="$5">
      <OrSeparator label={t('common.or')} />
      <Stack gap="$3">
        <AppleSignIn />
        <GoogleSignIn />
      </Stack>
    </YStack>
  )
}

function OrSeparator({ label }: { label: string }) {
  return (
    <YStack>
      <YStack position="absolute" fullscreen alignItems="center" justifyContent="center">
        <Separator flex={1} />
      </YStack>
      <YStack alignItems="center" justifyContent="center">
        <YStack borderColor={isWeb ? '$color1' : 'transparent'} paddingHorizontal="$3">
          <SizableText size="$2" textTransform="uppercase" textAlign="center">
            {label}
          </SizableText>
        </YStack>
      </YStack>
    </YStack>
  )
}
