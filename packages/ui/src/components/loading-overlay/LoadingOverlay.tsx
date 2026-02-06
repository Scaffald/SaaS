import { YStack, type YStackProps } from '@tamagui/stacks'
import { Spinner } from 'tamagui'

export const LoadingOverlay = (props: YStackProps) => {
  return (
    <YStack
      borderColor="$color12"
      position="absolute"
      fullscreen
      flex={1}
      style={{ justifyContent: 'center', alignItems: 'center' }}
      {...props}
    >
      <Spinner />
    </YStack>
  )
}
