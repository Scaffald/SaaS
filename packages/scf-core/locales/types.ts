import type { EnTranslations } from './en'

type DotNestedKeys<T> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? `${K}` | `${K}.${DotNestedKeys<T[K]>}`
    : `${K}`
}[keyof T & string]

export type TranslationNamespaces = keyof EnTranslations

export type TranslationKey = DotNestedKeys<EnTranslations>
