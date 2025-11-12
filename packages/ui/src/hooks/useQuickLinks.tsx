import { useMemo } from 'react'
import { usePathname } from 'expo-router'

import {
  QuickLinksWidget,
  type QuickLinksWidgetProps,
} from '../components/navigation/QuickLinksWidget'

export type UseQuickLinksOptions = Omit<QuickLinksWidgetProps, 'currentPath'> & {
  enabled?: boolean
}

export const useQuickLinks = (options: UseQuickLinksOptions = {}) => {
  const { enabled = true, routes, maxDepth, title, emptyStateText } = options

  const pathname = usePathname?.() ?? '/'

  return useMemo(() => {
    if (!enabled) return null

    return (
      <QuickLinksWidget
        currentPath={pathname}
        routes={routes}
        maxDepth={maxDepth}
        title={title}
        emptyStateText={emptyStateText}
      />
    )
  }, [enabled, pathname, routes, maxDepth, title, emptyStateText])
}
