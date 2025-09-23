import { TamaguiProvider, Theme, type ThemeName, YStack } from '@app/ui'
import type { Decorator } from '@storybook/react'
import { UniversalThemeProvider } from '@app/core/provider/theme'
import { ToastProvider } from '@app/core/provider/toast'
import React from 'react'
import { config } from '@app/ui'

type StoryArgs = Parameters<Decorator>[1]

export const StorybookDecorator: Decorator = (Story, args: StoryArgs) => {
  const {
    theme1,
    theme2,
    theme3,
    theme4,
    // inverseTheme
  } = args.globals
  const themeName = [theme2, theme3, theme4].filter((theme) => !!theme).join('_') || null

  return (
    <UniversalThemeProvider>
      <TamaguiProvider config={config} defaultTheme={theme1}>
        <ToastProvider>
          <YStack backgroundColor="$background" padding="$4" f={1}>
            <Theme forceClassName name={themeName as ThemeName}>
              <Story />
            </Theme>
          </YStack>
        </ToastProvider>
      </TamaguiProvider>
    </UniversalThemeProvider>
  )
}
