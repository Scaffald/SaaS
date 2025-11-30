import type { ComponentProps } from 'react'
import type { ColorTokens, FontSizeTokens, SpaceTokens, ThemeName, XStackProps } from 'tamagui'
import { Text, Theme, XStack } from 'tamagui'

const badgeSizing: Record<
  'sm' | 'md',
  { px: SpaceTokens; py: SpaceTokens; fontSize: FontSizeTokens }
> = {
  sm: { px: '$2', py: '$1', fontSize: '$1' },
  md: { px: '$3', py: '$1', fontSize: '$2' },
}

export type NotificationTagProps = {
  themeName: ThemeName
  size?: 'sm' | 'md'
  textColorToken?: ColorTokens
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
