/**
 * ErrorState – error display with optional retry
 * Use when operations fail and need to communicate errors.
 */

import { View } from 'react-native'
import { Stack } from '../Layout'
import { Paragraph, Text } from '../Typography'
import { Button } from '../Button'
import { CancelIcon } from '../Icon'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { borderRadius, borderWidth } from '../../tokens/borders'
import type { ErrorStateProps } from './States.types'

export function ErrorState({
  icon,
  title,
  description,
  error,
  retry,
  retryText = 'Retry',
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : (error as string | undefined)

  return (
    <Stack
      flex={1}
      align="center"
      justify="center"
      gap={spacing[4]}
      style={{
        padding: spacing[8],
        minHeight: 300,
      }}
    >
      <Stack align="center">
        {icon ?? <CancelIcon size={48} color={colors.error[500]} />}
      </Stack>
      <Text
        size="xl"
        weight="semibold"
        color="error"
        align="center"
      >
        {title}
      </Text>
      {description && (
        <Paragraph
          align="center"
          color="secondary"
          style={{ maxWidth: 400 }}
        >
          {description}
        </Paragraph>
      )}
      {errorMessage && (
        <View
          style={{
            backgroundColor: colors.error[50],
            padding: spacing[4],
            borderRadius: borderRadius.m,
            maxWidth: 500,
            borderWidth: borderWidth.thin,
            borderColor: colors.error[200],
          }}
        >
          <Text size="sm" style={{ fontFamily: 'monospace', color: colors.error[700] }}>
            {errorMessage}
          </Text>
        </View>
      )}
      {retry && (
        <Stack style={{ marginTop: spacing[4] }}>
          <Button variant="filled" color="primary" onPress={retry}>
            {retryText}
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
