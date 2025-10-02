import { Separator, SizableText, YStack, XStack, isWeb } from 'tamagui'

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
      <YStack position="absolute" fullscreen items="center" justify="center">
        <Separator flex={1} />
      </YStack>
      <YStack items="center" justify="center">
        <YStack borderColor={isWeb ? '$color1' : 'transparent'} px="$3">
          <SizableText size="$2" textTransform="uppercase" text="center">
            Or
          </SizableText>
        </YStack>
      </YStack>
    </YStack>
  )
}
