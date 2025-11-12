import { Separator, SizableText, YStack, XStack, isWeb } from 'tamagui'
import { useTranslation } from '@app/core/utils/useTranslation'

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
      <YStack position="absolute" fullscreen items="center" justify="center">
        <Separator flex={1} />
      </YStack>
      <YStack items="center" justify="center">
        <YStack borderColor={isWeb ? '$color1' : 'transparent'} px="$3">
          <SizableText size="$2" textTransform="uppercase" text="center">
            {label}
          </SizableText>
        </YStack>
      </YStack>
    </YStack>
  )
}
