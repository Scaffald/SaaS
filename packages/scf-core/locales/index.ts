import * as Localization from 'expo-localization'
import { I18n } from 'i18n-js'

import en from './en'
import es from './es'
import fr from './fr'
import type { TranslationKey } from './types'

export type { TranslationKey, TranslationNamespaces } from './types'

declare const __DEV__: boolean | undefined

export const translations = {
  en,
  es,
  fr,
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

const collectDuplicateKeys = (data: Record<string, unknown>): string[] => {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  const traverse = (node: unknown, prefix: string) => {
    if (node === null || typeof node !== 'object') {
      return
    }

    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (seen.has(fullKey)) {
        duplicates.add(fullKey)
      } else {
        seen.add(fullKey)
      }
      traverse(value, fullKey)
    }
  }

  traverse(data, '')
  return Array.from(duplicates).sort()
}

type TranslationWarningType = 'missing' | 'object'

const formatScope = (scope: string | string[]): string =>
  Array.isArray(scope) ? scope.join('.') : String(scope)

const captureCallerContext = () => {
  const stack = new Error().stack
  if (!stack) {
    return undefined
  }

  const frames = stack.split('\n').slice(3)
  const frame = frames.find((line) => !line.includes('i18n-js'))
  return frame?.trim()
}

type DebuggableOptions = Record<string, unknown> & { debugContext?: string }

const extractDebugContext = (options?: Record<string, unknown>): string | undefined => {
  if (options && typeof options === 'object' && 'debugContext' in options) {
    const { debugContext } = options as DebuggableOptions
    if (typeof debugContext === 'string' && debugContext.length > 0) {
      return debugContext
    }
  }
  return undefined
}

const logTranslationWarning = ({
  issue,
  key,
  locale,
  context,
  actualValue,
}: {
  issue: TranslationWarningType
  key: string
  locale: string
  context?: string
  actualValue?: unknown
}) => {
  if (!isDevEnvironment) {
    return
  }

  const parts = [
    `[i18n] ${
      issue === 'object' ? 'Translation resolved to object' : 'Missing translation'
    } for key "${key}" (locale: "${locale}")`,
  ]

  if (context) {
    parts.push(`Context: ${context}`)
  } else {
    const caller = captureCallerContext()
    if (caller) {
      parts.push(`Caller: ${caller}`)
    }
  }

  if (issue === 'object' && typeof actualValue === 'object') {
    console.warn(parts.join(' | '), actualValue)
  } else {
    console.warn(parts.join(' | '))
  }
}

const translationFallback = (key: string) => key

const warnMissingTranslation = (key: string, locale: string) => {
  logTranslationWarning({
    issue: 'missing',
    key,
    locale,
  })
}

const warnObjectTranslation = (
  key: string,
  locale: string,
  context?: string,
  actualValue?: unknown
) => {
  logTranslationWarning({
    issue: 'object',
    key,
    locale,
    context,
    actualValue,
  })
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

type TranslateFn = typeof i18n.t
const originalTranslate: TranslateFn = i18n.t.bind(i18n)

const translateWithGuards: TranslateFn = (scope, options) => {
  const key = formatScope(scope as string | string[])
  const locale = getCurrentLocale()
  const context = extractDebugContext(options as Record<string, unknown> | undefined)
  const resolvedValue = getTranslationValue(locale, key)

  if (resolvedValue && typeof resolvedValue === 'object') {
    warnObjectTranslation(key, locale, context, resolvedValue)
    return translationFallback(key)
  }

  const translated = originalTranslate(scope, options)

  if (typeof translated === 'string') {
    const trimmed = translated.trim()
    if (trimmed.length > 0) {
      return translated
    }
  } else if (typeof translated === 'number') {
    return String(translated)
  }

  warnMissingTranslation(key, locale)
  return translationFallback(key)
}

const guardedI18n = i18n as I18n & { t: TranslateFn; translate: TranslateFn }
guardedI18n.translate = translateWithGuards
guardedI18n.t = translateWithGuards

if (isDevEnvironment) {
  i18n.missingTranslation.register('dev-console', (_i18n, scope) => {
    const key = formatScope(scope as string | string[])
    warnMissingTranslation(key, String(i18n.locale))
    return translationFallback(key)
  })

  for (const [localeCode, localeData] of Object.entries(translations)) {
    const duplicates = collectDuplicateKeys(localeData)
    if (duplicates.length > 0) {
      console.warn(
        `[i18n] Duplicate translation keys detected in locale "${localeCode}": ${duplicates.join(
          ', '
        )}`
      )
    }
  }
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
