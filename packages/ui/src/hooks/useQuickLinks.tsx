import { useMemo } from 'react'
import { usePathname } from 'expo-router'

import {
  QuickLinksWidget,
  type QuickLinksWidgetProps,
} from '../components/navigation/QuickLinksWidget'

export type UseQuickLinksOptions = Omit<QuickLinksWidgetProps, 'currentPath'> & {
  enabled?: boolean
}

const normalizePath = (value: string | null | undefined) => {
  if (!value) return '/'
  if (value === '/') return value
  return value.replace(/\/+$/, '')
}

const isDashboardIndex = (path: string) => {
  return path === '/dashboard' || path === '/dashboard/index'
}

export const useQuickLinks = (options: UseQuickLinksOptions = {}) => {
  const { enabled = true, routes, maxDepth, title, emptyStateText } = options

  const pathname = usePathname?.() ?? '/'
  const normalizedPathname = normalizePath(pathname)

  return useMemo(() => {
    if (!enabled || isDashboardIndex(normalizedPathname)) return null

    return (
      <QuickLinksWidget
        currentPath={normalizedPathname}
        routes={routes}
        maxDepth={maxDepth}
        title={title}
        emptyStateText={emptyStateText}
      />
    )
  }, [enabled, normalizedPathname, routes, maxDepth, title, emptyStateText])
}
