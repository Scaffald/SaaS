import { Theme, XStack, Text } from 'tamagui'
import type { ThemeName, SizeTokens, XStackProps } from 'tamagui'
import type { ComponentProps } from 'react'

const badgeSizing: Record<'sm' | 'md', { px: SizeTokens; py: SizeTokens; fontSize: SizeTokens }> = {
  sm: { px: '$2', py: '$1', fontSize: '$1' },
  md: { px: '$3', py: '$1', fontSize: '$2' },
}

export type NotificationTagProps = {
  themeName: ThemeName
  size?: 'sm' | 'md'
  textColorToken?: `$${string}`
  textProps?: ComponentProps<typeof Text>
} & XStackProps

export const NotificationTag = ({
  themeName,
  size = 'sm',
  textColorToken = '$color11',
  textProps,
  children,
  ...rest
}: NotificationTagProps) => {
  const sizing = badgeSizing[size]

  return (
    <Theme name={themeName}>
      <XStack {...rest} bg="$color3" rounded="$3" items="center" px={sizing.px} py={sizing.py}>
        <Text fontSize={sizing.fontSize} fontWeight="600" color={textColorToken} {...textProps}>
          {children}
        </Text>
      </XStack>
    </Theme>
  )
}
