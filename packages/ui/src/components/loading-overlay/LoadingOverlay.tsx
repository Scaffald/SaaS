import { Spinner, YStack, type YStackProps } from '@unicornlove/ui'

export const LoadingOverlay = (props: YStackProps) => {
  return (
    <YStack
      borderColor="$color12"
      position="absolute"
      fullscreen
      flex={1}
      justifyContent="center"
      alignItems="center"
      {...props}
    >
      <Spinner />
    </YStack>
  )
}
