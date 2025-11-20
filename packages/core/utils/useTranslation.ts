import { useCallback, useEffect, useState } from 'react'

import {
  getCurrentLocale,
  i18n,
  type SupportedLocale,
  setLocale as setGlobalLocale,
  subscribeToLocaleChanges,
} from '../locales'

interface TranslationOptions {
  t: (key: string, params?: Record<string, unknown>) => string
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
}

export function useTranslation(): TranslationOptions {
  const [locale, setLocaleState] = useState<SupportedLocale>(getCurrentLocale())

  useEffect(() => {
    const unsubscribe = subscribeToLocaleChanges(() => {
      setLocaleState(getCurrentLocale())
    })

    return unsubscribe
  }, [])

  const t = useCallback((key: string, params?: Record<string, unknown>) => i18n.t(key, params), [])

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    setGlobalLocale(nextLocale)
    setLocaleState(getCurrentLocale())
  }, [])

  return { t, locale, setLocale }
}
