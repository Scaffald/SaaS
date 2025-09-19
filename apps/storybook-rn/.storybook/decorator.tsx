import { TamaguiProvider, YStack } from '@my/ui'
import type { Decorator } from '@storybook/react'
import { UniversalThemeProvider } from 'app/provider/theme'
import { ToastProvider } from 'app/provider/toast'
import React from 'react'
import { config } from '@my/ui'

type StoryArgs = Parameters<Decorator>[1]

export const StorybookDecorator: Decorator = (Story, _args: StoryArgs) => {
  return (
    <UniversalThemeProvider>
      <TamaguiProvider config={config} defaultTheme="light">
        <ToastProvider noSafeArea>
          <YStack bc="$background" f={1}>
            <Story />
          </YStack>
        </ToastProvider>
      </TamaguiProvider>
    </UniversalThemeProvider>
  )
}
