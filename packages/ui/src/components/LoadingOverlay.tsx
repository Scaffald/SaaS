import { Spinner, YStack, type YStackProps } from 'tamagui'

export const LoadingOverlay = (props: YStackProps) => {
  return (
    <YStack
      borderColor="$color12"
      position="absolute"
      fullscreen
      flex={1}
      justify="center"
      items="center"
      {...props}
    >
      <Spinner />
    </YStack>
  )
}
