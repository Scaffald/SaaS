import {
  tamaguiConfig,
  isWeb,
  TamaguiProvider as TamaguiProviderOG,
  useDidFinishSSR,
} from '@unicornlove/ui'
import type { ReactNode } from 'react'
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
    <TamaguiProviderOG config={tamaguiConfig} disableInjectCSS={false} defaultTheme={defaultTheme}>
      {children}
    </TamaguiProviderOG>
  )
}
