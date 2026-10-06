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

/**
 * The OS colour scheme, read in a way the server can agree with.
 *
 * Reading `matchMedia` during render gave a dark-OS visitor a first client
 * render that disagreed with the server's (which can only ever say light).
 * React recovered from the hydration mismatch by regenerating the tree, and
 * the regenerated tree came out LIGHT — while InnerProvider's effect, running
 * on the client's value, stamped `<html data-theme="dark">` and painted the
 * body dark. That is the half-dark page of #970: a dark ground under a light
 * shell, and names in `text.dark.primary` (white) on light rows the moment
 * anything mounted late enough to read the real value.
 *
 * So on web the scheme starts as the server's `light` and moves to the real
 * value in an effect, after hydration, the same way the stored preference
 * already did — and that path was the one that worked (OS light, stored
 * dark). It also follows the OS live. Native keeps `useColorScheme`.
 */
const useSystemTheme = (): 'light' | 'dark' => {
  const native = useColorScheme()
  const [web, setWeb] = useState<'light' | 'dark'>('light')
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => setWeb(query.matches ? 'dark' : 'light')
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])
  return Platform.OS === 'web' ? web : native === 'dark' ? 'dark' : 'light'
}

// Start early theme loading
let persistedTheme: ThemeName | null = null
export const loadThemePromise = getStoredTheme()
loadThemePromise.then((val) => {
  persistedTheme = val
})

export const UniversalThemeProvider = ({ children }: { children: ReactNode }) => {
  const [current, setCurrent] = useState<ThemeName | null>(null)
  const systemTheme = useSystemTheme()

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
  const { resolvedTheme, current } = useThemeSetting()

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
    } else if (current === 'system') {
      // Follow the OS: clear any override this process set earlier. The
      // override is per-process and survives a JS reload, so a forced
      // 'light' from a previous preference pinned `useColorScheme()` to
      // light for the rest of the session — the OS could go dark and the
      // app would never hear about it (#840, seen on the simulator).
      // 'unspecified' is RN's spelling of "no override" (UIUserInterfaceStyleUnspecified).
      if (Appearance.getColorScheme() !== 'unspecified') Appearance.setColorScheme('unspecified')
    } else if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
      // An explicit preference: pin the native scheme so system surfaces —
      // alerts, the keyboard, the share sheet — match the app.
      if (resolvedTheme !== Appearance.getColorScheme()) Appearance.setColorScheme(resolvedTheme)
    }
  }, [resolvedTheme, current])

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

  // Dark resolution goes through `resolveThemePreference` (see
  // ./dark-mode-flag.ts for the history of the gate it used to sit behind).
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
