'use client'

import { YStack } from '@app/ui'
import { useCallback, useState } from 'react'

import { DrawerContent } from './DrawerContent'
import { normalizePath } from './utils'
import { usePathname } from '@app/core/utils/usePathname'

export const StaticDrawer = ({ onNavigate }: { onNavigate?: () => void } = {}) => {
  const pathname = normalizePath(usePathname())

  // State for managing expanded items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = useCallback((key: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }, [])

  return (
    <YStack backgroundColor="$color2" flexShrink={0} minHeight="100vh" px="$0">
      <DrawerContent
        pathname={pathname}
        onNavigate={() => onNavigate?.()}
        expandedItems={expandedItems}
        onToggleExpanded={toggleExpanded}
      />
    </YStack>
  )
}

export default StaticDrawer
