import type { ComponentProps } from 'react'
import type { ColorTokens, ThemeName } from '@tamagui/core'
import { Theme } from '@tamagui/core'
import type { XStackProps } from '@tamagui/stacks'
import { XStack } from '@tamagui/stacks'
import { Text } from 'tamagui'

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
        background="$color3"
        br="$3"
        style={{ alignItems: 'center' }}
        px={sizing.paddingHorizontal}
        py={sizing.paddingVertical}
      >
        <Text fontSize={sizing.fontSize} fontWeight="600" color={textColorToken} {...textProps}>
          {children}
        </Text>
      </XStack>
    </Theme>
  )
}
