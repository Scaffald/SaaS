import { Spinner, type SpinnerProps } from 'tamagui'
import { YStack } from '@tamagui/stacks'

export const FullscreenSpinner = (props: SpinnerProps) => {
  return (
    <YStack flex={1} style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Spinner {...props} />
    </YStack>
  )
}
