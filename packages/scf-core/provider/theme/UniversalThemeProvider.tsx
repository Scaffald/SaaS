import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation'
import { useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { Appearance, Platform, useColorScheme } from 'react-native'

import { isLightOnlySurface, resolveThemePreference } from './dark-mode-flag'
import { useIsomorphicLayoutEffect } from '@scf/core/hooks/useIsomorphicLayoutEffect'
import { kvStorage } from '@scf/core/utils/platform'
import { colors } from '@scaffald/ui/tokens'

type ThemeProviderProps = {
  themes: string[]
  onChangeTheme: (theme: string) => void
  current: string
  systemTheme: 'light' | 'dark'
}

type ThemeContextValue = (ThemeProviderProps & { current?: string | null }) | null
export const ThemeContext = createContext<ThemeContextValue>(null)

type ThemeName = 'light' | 'dark' | 'system'

const getStoredTheme = async (): Promise<ThemeName | null> => {
  try {
    return (await kvStorage.get('@preferred_theme')) as ThemeName | null
  } catch {
    return null
  }
}

const setStoredTheme = (theme: ThemeName) => {
  void kvStorage.set('@preferred_theme', theme).catch(() => {
    // Ignore storage errors
  })
}

// Platform-specific system theme detection
const getSystemTheme = (): 'light' | 'dark' => {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  const colorScheme = useColorScheme()
  return colorScheme === 'dark' ? 'dark' : 'light'
}

// Start early theme loading
let persistedTheme: ThemeName | null = null
export const loadThemePromise = getStoredTheme()
loadThemePromise.then((val) => {
  persistedTheme = val
})

export const UniversalThemeProvider = ({ children }: { children: ReactNode }) => {
  const [current, setCurrent] = useState<ThemeName | null>(null)
  const systemTheme = Platform.OS === 'web' ? getSystemTheme() : useColorScheme() || 'light'

  useIsomorphicLayoutEffect(() => {
    async function main() {
      await loadThemePromise
      setCurrent(persistedTheme ?? 'system')
    }
    main()
  }, [])

  useEffect(() => {
    if (current) {
      setStoredTheme(current)
    }
  }, [current])

  const themeContext = useMemo(() => {
    return {
      themes: ['light', 'dark'],
      onChangeTheme: (next: string) => {
        setCurrent(next as ThemeName)
      },
      current: current ?? 'system',
      systemTheme: systemTheme as 'light' | 'dark',
    } satisfies ThemeContextValue
  }, [current, systemTheme])

  // Native-only gate. `typeof window` is also defined during client hydration,
  // so blanking here mismatched the server-rendered HTML (React #418).
  // `themeContext.current` already falls back to 'system', so web can render
  // before the stored theme resolves.
  if (current === null && Platform.OS !== 'web') {
    return null // Render nothing until theme is loaded
  }

  return (
    <ThemeContext.Provider value={themeContext}>
      <InnerProvider>{children}</InnerProvider>
    </ThemeContext.Provider>
  )
}

// Custom React Navigation themes that use our app's background colors.
// DefaultTheme.colors.background is rgb(242,242,242) which shows up during overscroll —
// we override it to match our default background so everything is seamless.
const AppLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg.light.default,
  },
}

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg.dark.default,
  },
}

const InnerProvider = ({ children }: { children: ReactNode }) => {
  const { resolvedTheme } = useThemeSetting()

  // Platform-specific theme application
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', resolvedTheme)
        // Match the app's background so overscroll bounce areas use the same color
        const bg = resolvedTheme === 'dark' ? colors.bg.dark.default : colors.bg.light.default
        document.documentElement.style.backgroundColor = bg
        document.body.style.backgroundColor = bg
      }
    } else {
      // Native: ensure we set color scheme as soon as possible
      if (resolvedTheme !== Appearance.getColorScheme()) {
        if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
          Appearance.setColorScheme(resolvedTheme)
        }
      }
    }
  }, [resolvedTheme])

  const navTheme = resolvedTheme === 'dark' ? AppDarkTheme : AppLightTheme

  // Wrap all platforms with React Navigation theme provider — expo-router's
  // Stack uses React Navigation components that require theme context
  // (Background, Header, etc.).
  if (Platform.OS === 'web') {
    return <ThemeProvider value={navTheme}>{children as ReactNode}</ThemeProvider>
  }

  // Native: also include status bar
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} hidden />
      {children as ReactNode}
    </ThemeProvider>
  )
}

export const useThemeSetting = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useThemeSetting should be used within the context provider.')
  }

  // Dark resolution is restored, gated on EXPO_PUBLIC_DARK_MODE=1 (#833 part 1).
  // Without the flag this returns 'light' for every preference, so production
  // behaves exactly as it did while the old hardcoded cast was here. See
  // ./dark-mode-flag.ts for why it is an env flag and not `__DEV__`.
  //
  // Forced light on the anonymous surface (#953). Both readers of this hook —
  // ThemeBridge, which drives @scaffald/ui's provider, and InnerProvider, which
  // stamps <html data-theme> and the page background — go through here, so
  // pinning it once is what keeps the ground and the content agreeing. Pinning
  // only the background would have left themed components rendering dark on a
  // light page.
  const segments = useSegments()
  const resolvedTheme = isLightOnlySurface(segments)
    ? 'light'
    : resolveThemePreference(context.current, context.systemTheme)

  const outputContext = {
    ...context,
    systemTheme: context.systemTheme as 'light' | 'dark',
    themes: context.themes || ['light', 'dark'],
    current: context.current ?? 'system',
    resolvedTheme,
    set: (value: string) => {
      context.onChangeTheme?.(value)
    },
    toggle: () => {
      const map = {
        light: 'dark',
        dark: 'system',
        system: 'light',
      }
      context.onChangeTheme?.(map[(context.current as ThemeName) ?? 'system'])
    },
  }

  return outputContext
}

export const useRootTheme = () => {
  const context = useThemeSetting()
  // The same resolution as the hook, through the same helper — open-coding it
  // again is how the two drift, and this one was already reachable while the
  // hook was hardcoded to light.
  return [resolveThemePreference(context.current, context.systemTheme), context.set]
}
