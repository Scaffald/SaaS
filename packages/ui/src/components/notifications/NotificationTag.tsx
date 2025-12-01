import type { ComponentProps } from 'react'
import type { ColorTokens, FontSizeTokens, SpaceTokens, ThemeName, XStackProps } from 'tamagui'
import { Text, Theme, XStack } from 'tamagui'

const badgeSizing: Record<
  'sm' | 'md',
  { paddingHorizontal: SpaceTokens; paddingVertical: SpaceTokens; fontSize: FontSizeTokens }
> = {
  sm: { paddingHorizontal: '$2', paddingVertical: '$1', fontSize: '$1' },
  md: { paddingHorizontal: '$3', paddingVertical: '$1', fontSize: '$2' },
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
      <XStack
        {...rest}
        backgroundColor="$color3"
        borderRadius="$3"
        alignItems="center"
        paddingHorizontal={sizing.px}
        paddingVertical={sizing.py}
      >
        <Text fontSize={sizing.fontSize} fontWeight="600" color={textColorToken} {...textProps}>
          {children}
        </Text>
      </XStack>
    </Theme>
  )
}
