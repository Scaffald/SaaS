import * as Localization from 'expo-localization'
import { I18n } from 'i18n-js'

import en from './en'
import es from './es'
import type { TranslationKey } from './types'

export type { TranslationKey, TranslationNamespaces } from './types'

declare const __DEV__: boolean | undefined

export const translations = {
  en,
  es,
} as const

export type SupportedLocale = keyof typeof translations

const DEFAULT_LOCALE: SupportedLocale = 'en'

const localeListeners = new Set<() => void>()

const isSupportedLocale = (locale: string): locale is SupportedLocale =>
  Object.hasOwn(translations, locale)

const normalizeLocale = (languageTag?: string | null): SupportedLocale => {
  if (!languageTag) {
    return DEFAULT_LOCALE
  }

  const normalizedTag = languageTag.replace('_', '-').toLowerCase()
  const candidates = [normalizedTag, normalizedTag.split('-')[0] ?? normalizedTag]

  const match = candidates.find(
    (candidate): candidate is SupportedLocale => Boolean(candidate) && isSupportedLocale(candidate)
  )

  return match ?? DEFAULT_LOCALE
}

const resolveInitialLocale = (): SupportedLocale => {
  if (typeof Localization.getLocales === 'function') {
    const locales = Localization.getLocales()
    if (locales?.length) {
      const [primary] = locales
      return normalizeLocale(primary?.languageTag ?? primary?.languageCode)
    }
  }

  // Fallback: try to get locale from getLocales if available, otherwise use default
  if (typeof Localization.getLocales === 'function') {
    const locales = Localization.getLocales()
    if (locales?.length) {
      const [primary] = locales
      return normalizeLocale(primary?.languageTag ?? primary?.languageCode)
    }
  }
  return DEFAULT_LOCALE
}

export const i18n = new I18n(translations)

i18n.defaultLocale = DEFAULT_LOCALE
i18n.enableFallback = true
const initialLocale = resolveInitialLocale()
i18n.locale = initialLocale
i18n.missingBehavior = 'guess'

const isDevEnvironment =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  (typeof process !== 'undefined' &&
    process.env.NODE_ENV !== undefined &&
    process.env.NODE_ENV !== 'production')

if (isDevEnvironment) {
  i18n.missingTranslation.register('dev-console', (_i18n, scope) => {
    const key = Array.isArray(scope) ? scope.join('.') : String(scope)
    console.warn(`[i18n] Missing translation for key "${key}" (locale: "${i18n.locale}")`)
    return key
  })
}

export const supportedLocales = Object.keys(translations) as SupportedLocale[]

export const defaultLocale = DEFAULT_LOCALE

export const subscribeToLocaleChanges = (listener: () => void) => {
  localeListeners.add(listener)
  return () => {
    localeListeners.delete(listener)
  }
}

export const setLocale = (locale: SupportedLocale) => {
  if (getCurrentLocale() === locale && i18n.locale === locale) {
    return
  }

  i18n.locale = locale
  for (const listener of localeListeners) {
    listener()
  }
}

export const getCurrentLocale = (): SupportedLocale => normalizeLocale(i18n.locale)

const getTranslationValue = (locale: SupportedLocale, key: string) => {
  const segments = key.split('.')
  let value: unknown = translations[locale]

  for (const segment of segments) {
    if (value && typeof value === 'object' && segment in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }

  return value
}

export const hasTranslation = (
  key: TranslationKey,
  locale: SupportedLocale = getCurrentLocale()
) => {
  const value = getTranslationValue(locale, key)
  return typeof value === 'string' || typeof value === 'number'
}
