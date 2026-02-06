import { Box, Spinner } from '@unicornlove/beyond-ui'

export function LoadingOverlay() {
  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      flex={1}
      align="center"
      justify="center"
    >
      <Spinner />
    </Box>
  )
}
