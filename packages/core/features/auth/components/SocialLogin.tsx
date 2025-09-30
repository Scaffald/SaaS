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
      <YStack pos="absolute" fullscreen items="center" justify="center">
        <Separator flex={1} w="100%" />
      </YStack>
      <YStack items="center" justify="center">
        <YStack bc={isWeb ? '$color1' : 'transparent'} px="$3">
          <SizableText theme="alt1" size="$2" tt="uppercase" ta="center">
            Or
          </SizableText>
        </YStack>
      </YStack>
    </YStack>
  )
}
