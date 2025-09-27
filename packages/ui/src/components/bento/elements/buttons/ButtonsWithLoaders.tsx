import { useState } from 'react'
import type { SizeTokens } from 'tamagui'
import { AnimatePresence, Button, Spinner, View, YStack } from 'tamagui'
import { LoadingButton } from '../../../AnimatedButton'

/** ------ EXAMPLE ------ */
export function ButtonsWithLoaders() {
  return (
    <YStack gap="$3.5" $group-window-gtSm={{ flexDirection: 'row' }}>
      <View gap="$2">
        <LoadingButton
          theme="blue"
          loading={true}
          loadingText="Loading..."
          animationPreset="bouncy"
        >
          Themed
        </LoadingButton>

        <LoadingButton theme="red" loading={true} loadingText="Loading..." animationPreset="bouncy">
          Themed
        </LoadingButton>

        <LoadingButton
          theme="green"
          loading={true}
          loadingText="Loading..."
          animationPreset="bouncy"
        >
          Themed
        </LoadingButton>

        <LoadingButton
          theme="purple"
          loading={true}
          loadingText="Loading..."
          animationPreset="bouncy"
        >
          Themed
        </LoadingButton>

        <LoadingButton
          theme="pink"
          loading={true}
          loadingText="Loading..."
          animationPreset="bouncy"
        >
          Themed
        </LoadingButton>

        <LoadingButton
          theme="yellow"
          loading={true}
          loadingText="Loading..."
          animationPreset="bouncy"
        >
          Themed
        </LoadingButton>

        <LoadingButton
          theme="orange"
          loading={true}
          loadingText="Loading..."
          animationPreset="bouncy"
        >
          Themed
        </LoadingButton>
      </View>

      <View gap="$2">
        <LoadingButton
          theme="active"
          loading={true}
          loadingText="Loading..."
          animationPreset="bouncy"
        >
          Active
        </LoadingButton>

        <LoadingButton disabled loading={true} loadingText="Loading..." animationPreset="bouncy">
          Disabled
        </LoadingButton>

        <LoadingButton
          themeInverse
          loading={true}
          loadingText="Loading..."
          animationPreset="bouncy"
        >
          Theme inverse
        </LoadingButton>

        <LoadingButton
          variant="outlined"
          loading={true}
          loadingText="Loading..."
          animationPreset="bouncy"
        >
          Outlined
        </LoadingButton>

        <LoadingButton chromeless loading={true} loadingText="Loading..." animationPreset="bouncy">
          Chromeless
        </LoadingButton>
      </View>

      <View gap="$2">
        <LoadingButton size="$3" loading={true} loadingText="Loading..." animationPreset="bouncy">
          Small
        </LoadingButton>

        <LoadingButton loading={true} loadingText="Loading..." animationPreset="bouncy">
          Normal
        </LoadingButton>

        <LoadingButton size="$6" loading={true} loadingText="Loading..." animationPreset="bouncy">
          Big
        </LoadingButton>
      </View>
    </YStack>
  )
}

ButtonsWithLoaders.fileName = 'ButtonsWithLoaders'

function EachButton({ size }: { size: SizeTokens }) {
  const [loading, setLoading] = useState(true)
  return (
    <LoadingButton
      size={size}
      loading={loading}
      loadingText="Loading..."
      animationPreset="bouncy"
      onPress={() => setLoading(!loading)}
    >
      Click
    </LoadingButton>
  )
}
