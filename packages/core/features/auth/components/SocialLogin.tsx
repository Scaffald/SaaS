import { Separator, SizableText, YStack, XStack, isWeb } from '@app/ui'

import { AppleSignIn } from './AppleSignIn'
import { GoogleSignIn } from './GoogleSignIn'

export function SocialLogin() {
  const Stack = isWeb ? XStack : YStack

  return (
    <YStack gap="$5">
      <OrSeparator />
      <Stack gap="$3">
        <AppleSignIn />
        <GoogleSignIn />
      </Stack>
    </YStack>
  )
}

function OrSeparator() {
  return (
    <YStack>
      <YStack pos="absolute" fullscreen ai="center" jc="center">
        <Separator f={1} w="100%" />
      </YStack>
      <YStack ai="center" jc="center">
        <YStack bc={isWeb ? '$color1' : 'transparent'} px="$3">
          <SizableText theme="alt1" size="$2" tt="uppercase" ta="center">
            Or
          </SizableText>
        </YStack>
      </YStack>
    </YStack>
  )
}
