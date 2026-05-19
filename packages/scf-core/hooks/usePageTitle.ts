import { useNavigation } from '@react-navigation/native'
import type { NavigationProp, ParamListBase } from '@react-navigation/native'
import { useEffect, useMemo } from 'react'
import { setDocumentTitle } from '@scf/core/utils/platform'

declare const __DEV__: boolean | undefined

type TitleValue = string | null | undefined

type UsePageTitleProps = {
  /**
   * Static or dynamic title value.
   * Pass a string for static titles or a function so the value can be
   * derived lazily from fetched data.
   */
  title: TitleValue | (() => TitleValue)
  /**
   * Optional array of dependencies that should re-run the title updater
   * when using a lazy function.
   */
  deps?: ReadonlyArray<unknown>
  /**
   * Optional formatter to customize how document titles are set on web.
   * Defaults to the plain title string.
   */
  formatDocumentTitle?: (title: string) => string
}

const defaultFormatDocumentTitle = (title: string) => title

const isDevEnvironment =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  (typeof process !== 'undefined' &&
    process.env.NODE_ENV !== undefined &&
    process.env.NODE_ENV !== 'production')

const ROUTES_PREFIX = 'routes.'

const isRouteTranslationKey = (value: string) => value.startsWith(ROUTES_PREFIX)

const humanizeSegment = (segment: string) =>
  segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())

const humanizeRouteKey = (key: string) => {
  const stripped = key.startsWith(ROUTES_PREFIX) ? key.slice(ROUTES_PREFIX.length) : key
  const segments = stripped
    .split('.')
    .filter((segment) => segment.length > 0 && segment !== 'title')
  const words = segments.map(humanizeSegment).filter((segment) => segment.length > 0)
  return words.length > 0 ? words.join(' ') : key
}

/**
 * Reusable hook for synchronizing Expo Router screen titles with route data.
 * Works for both static strings and lazy evaluators so it can respond to
 * asynchronous data fetching.
 */
export function usePageTitle({
  title,
  deps = [],
  formatDocumentTitle = defaultFormatDocumentTitle,
}: UsePageTitleProps) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>()

  const resolvedTitle = useMemo(() => {
    const value = typeof title === 'function' ? title() : title
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
  }, [title, ...deps])

  const safeTitle = useMemo(() => {
    if (!resolvedTitle) {
      return null
    }

    if (!isRouteTranslationKey(resolvedTitle)) {
      return resolvedTitle
    }

    const fallback = humanizeRouteKey(resolvedTitle)
    if (isDevEnvironment) {
      console.warn(
        `[usePageTitle] Received unresolved translation key "${resolvedTitle}". Falling back to "${fallback}".`
      )
    }

    return fallback
  }, [resolvedTitle])

  useEffect(() => {
    if (!safeTitle) {
      return
    }

    navigation.setOptions({ title: safeTitle })
    setDocumentTitle(formatDocumentTitle(safeTitle))
  }, [navigation, safeTitle, formatDocumentTitle])
}
