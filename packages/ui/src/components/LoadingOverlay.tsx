import { Spinner, YStack, YStackProps } from 'tamagui'

export const LoadingOverlay = (props: YStackProps) => {
  return (
    <YStack
      bc="$background05"
      pos="absolute"
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
