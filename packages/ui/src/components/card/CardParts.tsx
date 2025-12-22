/**
 * Additional Card parts not provided by @tamagui/card
 * These complement Card, CardHeader, CardFooter from @tamagui/card
 */
import { styled, Text } from '@tamagui/core'
import { YStack } from '@tamagui/stacks'

/**
 * CardTitle - A styled heading for card titles
 */
export const CardTitle = styled(Text, {
  name: 'CardTitle',
  fontSize: '$5',
  fontWeight: '600',
  color: '$color12',
})

/**
 * CardDescription - A styled text for card descriptions
 */
export const CardDescription = styled(Text, {
  name: 'CardDescription',
  fontSize: '$3',
  color: '$color11',
})

/**
 * CardContent - A container for card body content
 */
export const CardContent = styled(YStack, {
  name: 'CardContent',
  padding: '$4',
  gap: '$2',
})
