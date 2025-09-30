import { ReactNode } from 'react'
import { config, isWeb, TamaguiProvider as TamaguiProviderOG, useDidFinishSSR } from '@app/ui'

import { useRootTheme, useThemeSetting } from '../theme/UniversalThemeProvider'

export const TamaguiProvider = ({ children }: { children: ReactNode }) => {
  const [rootTheme] = useRootTheme()
  const themeSetting = useThemeSetting()
  const isHydrated = useDidFinishSSR()
  const defaultTheme =
    isHydrated && isWeb
      ? themeSetting.resolvedTheme || 'light'
      : typeof rootTheme === 'string'
        ? rootTheme
        : 'light'

  return (
    <TamaguiProviderOG config={config} disableInjectCSS={false} defaultTheme={defaultTheme}>
      {children}
    </TamaguiProviderOG>
  )
}
