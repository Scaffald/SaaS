import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  CookieConsentCategory,
  CookieConsentSelections,
  CookieConsentState,
  CookieConsentStorage,
} from './types'

export interface CookieConsentProviderProps {
  children: ReactNode
  categories?: CookieConsentCategory[]
  storage?: CookieConsentStorage
  storageKey?: string
  policyVersion?: string
  onConsentChange?: (state: CookieConsentState) => void
  onLoad?: (state: CookieConsentState | null) => void
}

interface CookieConsentContextValue {
  categories: CookieConsentCategory[]
  selections: CookieConsentSelections
  consentState: CookieConsentState | null
  shouldShowBanner: boolean
  isReady: boolean
  isPreferencesOpen: boolean
  openPreferences: () => void
  closePreferences: () => void
  acceptAll: () => Promise<void>
  rejectAll: () => Promise<void>
  saveSelections: (next: CookieConsentSelections) => Promise<void>
  hasConsentedTo: (categoryId: string) => boolean
  resetConsent: () => Promise<void>
  policyVersion: string
}

const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent-state'
const DEFAULT_POLICY_VERSION = '1'

const DEFAULT_CATEGORIES: CookieConsentCategory[] = [
  {
    id: 'strictly-necessary',
    label: 'Strictly Necessary',
    description:
      'These cookies are essential for the basic performance and security of the experience. They are required for things like logging in, keeping items in a cart, or remembering your privacy preferences.',
    required: true,
    defaultValue: true,
  },
  {
    id: 'functional',
    label: 'Functional',
    description:
      'Functional cookies help personalize the experience by remembering settings such as language, accessibility preferences, or saved progress in a flow.',
    defaultValue: false,
  },
  {
    id: 'performance',
    label: 'Performance & Analytics',
    description:
      'Performance cookies let us understand usage patterns so we can improve reliability and measure the effectiveness of new features.',
    defaultValue: false,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description:
      'Marketing cookies are used to deliver more relevant content, measure campaign performance, and avoid showing the same message repeatedly.',
    defaultValue: false,
  },
]

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined)

const memoryStorage = new Map<string, string | null>()

const createDefaultStorage = (): CookieConsentStorage => ({
  getItem: async (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key)
      } catch (error) {
        console.warn('CookieConsent: unable to read from localStorage', error)
      }
    }
    return memoryStorage.get(key) ?? null
  },
  setItem: async (key, value) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value)
        return
      } catch (error) {
        console.warn('CookieConsent: unable to write to localStorage', error)
      }
    }
    memoryStorage.set(key, value)
  },
  removeItem: async (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key)
        return
      } catch (error) {
        console.warn('CookieConsent: unable to remove from localStorage', error)
      }
    }
    memoryStorage.delete(key)
  },
})

const normaliseCategories = (categories: CookieConsentCategory[]) =>
  categories.map((category) => ({
    ...category,
    required: Boolean(category.required),
    defaultValue: category.required ? true : Boolean(category.defaultValue),
  }))

const buildSelections = (categories: CookieConsentCategory[], value: boolean | null = null) => {
  return categories.reduce<CookieConsentSelections>((acc, category) => {
    if (value === null) {
      acc[category.id] = category.required ? true : Boolean(category.defaultValue)
    } else {
      acc[category.id] = category.required ? true : value
    }
    return acc
  }, {})
}

const sanitiseSelections = (
  categories: CookieConsentCategory[],
  selections: CookieConsentSelections
) => {
  const defaults = buildSelections(categories)
  const next: CookieConsentSelections = {}
  for (const category of categories) {
    const existing = selections[category.id]
    next[category.id] = category.required
      ? true
      : typeof existing === 'boolean'
        ? existing
        : defaults[category.id]
  }
  return next
}

export const CookieConsentProvider = ({
  children,
  categories: categoriesProp = DEFAULT_CATEGORIES,
  storage: storageProp,
  storageKey = COOKIE_CONSENT_STORAGE_KEY,
  policyVersion = DEFAULT_POLICY_VERSION,
  onConsentChange,
  onLoad,
}: CookieConsentProviderProps) => {
  const categories = useMemo(() => normaliseCategories(categoriesProp), [categoriesProp])
  const [selections, setSelections] = useState<CookieConsentSelections>(() =>
    buildSelections(categories)
  )
  const [consentState, setConsentState] = useState<CookieConsentState | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const storageRef = useRef<CookieConsentStorage | null>(null)

  if (!storageRef.current) {
    storageRef.current = storageProp ?? createDefaultStorage()
  }

  useEffect(() => {
    setSelections((prev) => sanitiseSelections(categories, prev))
  }, [categories])

  useEffect(() => {
    let cancelled = false
    const loadConsent = async () => {
      const storage = storageRef.current ?? createDefaultStorage()
      try {
        const raw = await Promise.resolve(storage.getItem(storageKey))
        if (cancelled) return
        if (!raw) {
          setConsentState(null)
          setSelections(buildSelections(categories))
          onLoad?.(null)
          return
        }
        const parsed = JSON.parse(raw) as CookieConsentState | null
        if (!parsed || parsed.version !== policyVersion) {
          setConsentState(null)
          setSelections(buildSelections(categories))
          onLoad?.(null)
          return
        }
        const cleanedSelections = sanitiseSelections(categories, parsed.selections || {})
        const nextState: CookieConsentState = {
          version: policyVersion,
          updatedAt: parsed.updatedAt,
          selections: cleanedSelections,
        }
        setSelections(cleanedSelections)
        setConsentState(nextState)
        onLoad?.(nextState)
      } catch (error) {
        console.warn('CookieConsent: unable to parse stored consent', error)
        setConsentState(null)
        setSelections(buildSelections(categories))
        onLoad?.(null)
      } finally {
        if (!cancelled) {
          setIsReady(true)
        }
      }
    }

    loadConsent()

    return () => {
      cancelled = true
    }
  }, [categories, policyVersion, storageKey, onLoad])

  const persistSelections = useCallback(
    async (next: CookieConsentSelections) => {
      const storage = storageRef.current ?? createDefaultStorage()
      const sanitised = sanitiseSelections(categories, next)
      const state: CookieConsentState = {
        version: policyVersion,
        updatedAt: new Date().toISOString(),
        selections: sanitised,
      }
      setSelections(sanitised)
      setConsentState(state)
      try {
        await Promise.resolve(storage.setItem(storageKey, JSON.stringify(state)))
      } catch (error) {
        console.warn('CookieConsent: unable to persist consent selection', error)
      }
      onConsentChange?.(state)
    },
    [categories, onConsentChange, policyVersion, storageKey]
  )

  const acceptAll = useCallback(async () => {
    await persistSelections(buildSelections(categories, true))
    setIsPreferencesOpen(false)
  }, [categories, persistSelections])

  const rejectAll = useCallback(async () => {
    await persistSelections(buildSelections(categories, false))
    setIsPreferencesOpen(false)
  }, [categories, persistSelections])

  const saveSelections = useCallback(
    async (next: CookieConsentSelections) => {
      await persistSelections(next)
      setIsPreferencesOpen(false)
    },
    [persistSelections]
  )

  const resetConsent = useCallback(async () => {
    const storage = storageRef.current ?? createDefaultStorage()
    try {
      await Promise.resolve(storage.removeItem(storageKey))
    } catch (error) {
      console.warn('CookieConsent: unable to clear stored consent', error)
    }
    setSelections(buildSelections(categories))
    setConsentState(null)
    setIsPreferencesOpen(false)
  }, [categories, storageKey])

  const hasConsentedTo = useCallback(
    (categoryId: string) => {
      return Boolean(consentState?.selections?.[categoryId])
    },
    [consentState]
  )

  const openPreferences = useCallback(() => {
    setIsPreferencesOpen(true)
  }, [])

  const closePreferences = useCallback(() => {
    setIsPreferencesOpen(false)
  }, [])

  const shouldShowBanner = isReady && !consentState

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      categories,
      selections,
      consentState,
      shouldShowBanner,
      isReady,
      isPreferencesOpen,
      openPreferences,
      closePreferences,
      acceptAll,
      rejectAll,
      saveSelections,
      hasConsentedTo,
      resetConsent,
      policyVersion,
    }),
    [
      categories,
      selections,
      consentState,
      shouldShowBanner,
      isReady,
      isPreferencesOpen,
      openPreferences,
      closePreferences,
      acceptAll,
      rejectAll,
      saveSelections,
      hasConsentedTo,
      resetConsent,
      policyVersion,
    ]
  )

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
}

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext)
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  }
  return context
}

export const COOKIE_CONSENT_DEFAULTS = DEFAULT_CATEGORIES
