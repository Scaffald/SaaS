import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { TamaguiProvider, Theme } from 'tamagui'

import config from '../src/tamagui.config'

type ProvidersProps = { children: ReactNode }

const Providers = ({ children }: ProvidersProps) => {
  return (
    <TamaguiProvider config={config} defaultTheme="light" disableInjectCSS>
      <Theme name="light">{children}</Theme>
    </TamaguiProvider>
  )
}

const customRender = (ui: ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: Providers, ...options })

export * from '@testing-library/react'
export { customRender as render }
