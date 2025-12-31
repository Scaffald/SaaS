import { Spinner, type SpinnerProps, YStack } from '@unicornlove/ui'

export const FullscreenSpinner = (props: SpinnerProps) => {
  return (
    <YStack flex={1} justifyContent="center" alignItems="center">
      <Spinner {...props} />
    </YStack>
  )
}
