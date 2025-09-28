import { useIsomorphicLayoutEffect } from '@app/ui'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ThemeProviderProps = {
  themes: string[]
  onChangeTheme: (theme: string) => void
  current: string
  systemTheme: 'light' | 'dark'
}

type ThemeContextValue = (ThemeProviderProps & { current?: string | null }) | null
export const ThemeContext = createContext<ThemeContextValue>(null)

type ThemeName = 'light' | 'dark' | 'system'

// Web-compatible theme storage using localStorage
const getStoredTheme = (): ThemeName | null => {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('@preferred_theme') as ThemeName | null
  } catch {
    return null
  }
}

const setStoredTheme = (theme: ThemeName) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('@preferred_theme', theme)
  } catch {
    // Ignore storage errors
  }
}

// Web-compatible system theme detection
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// start early
let persistedTheme: ThemeName | null = null
export const loadThemePromise = Promise.resolve(getStoredTheme())
loadThemePromise.then((val) => {
  persistedTheme = val
})

export const UniversalThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [current, setCurrent] = useState<ThemeName | null>(null) // Start with null
  const systemTheme = getSystemTheme()

  useIsomorphicLayoutEffect(() => {
    async function main() {
      await loadThemePromise
      setCurrent(persistedTheme ?? 'system') // Set theme after loading
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
      current: current ?? 'system', // Default to 'system' if current is null
      systemTheme,
    } satisfies ThemeContextValue
  }, [current, systemTheme])

  if (current === null) {
    return null // Render nothing until theme is loaded
  }

  return (
    <ThemeContext.Provider value={themeContext}>
      <InnerProvider>{children}</InnerProvider>
    </ThemeContext.Provider>
  )
}

const InnerProvider = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useThemeSetting()

  // Web-compatible theme application
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolvedTheme)
    }
  }, [resolvedTheme])

  return <>{children}</>
}

export const useThemeSetting = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useThemeSetting should be used within the context provider.')
  }

  const resolvedTheme =
    context.current === 'system' ? context.systemTheme : (context.current ?? 'system')

  const outputContext = {
    ...context,
    systemTheme: context.systemTheme as 'light' | 'dark',
    themes: context.themes!,
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
  return [context.current === 'system' ? context.systemTheme : context.current, context.set]
}
