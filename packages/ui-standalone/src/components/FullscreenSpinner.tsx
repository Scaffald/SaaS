import { Spinner, type SpinnerProps, YStack } from 'tamagui'

export const FullscreenSpinner = (props: SpinnerProps) => {
  return (
    <YStack flex={1} justify="center" items="center">
      <Spinner {...props} />
    </YStack>
  )
}
