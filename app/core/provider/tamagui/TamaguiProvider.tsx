import { config, isWeb, TamaguiProvider as TamaguiProviderOG, useDidFinishSSR } from '@app/ui'

import { useRootTheme, useThemeSetting } from '../theme/UniversalThemeProvider'

export const TamaguiProvider = ({ children }: { children: React.ReactNode }) => {
  const [rootTheme] = useRootTheme()
  const themeSetting = useThemeSetting()
  const isHydrated = useDidFinishSSR()
  const resolvedTheme =
    typeof themeSetting === 'string' ? themeSetting : themeSetting?.resolvedTheme
  const rootThemeName = typeof rootTheme === 'string' ? rootTheme : 'light'
  const defaultTheme = isHydrated && isWeb ? resolvedTheme || 'light' : rootThemeName

  return (
    <TamaguiProviderOG
      config={config}
      disableInjectCSS
      disableRootThemeClass
      defaultTheme={defaultTheme}
    >
      {children}
    </TamaguiProviderOG>
  )
}
