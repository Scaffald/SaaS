import { useNavigation } from '@react-navigation/native'
import type { NavigationProp, ParamListBase } from '@react-navigation/native'
import { useEffect, useMemo } from 'react'
import { Platform } from 'react-native'

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

  useEffect(() => {
    if (!resolvedTitle) {
      return
    }

    navigation.setOptions({ title: resolvedTitle })

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = formatDocumentTitle(resolvedTitle)
    }
  }, [navigation, resolvedTitle, formatDocumentTitle])
}

