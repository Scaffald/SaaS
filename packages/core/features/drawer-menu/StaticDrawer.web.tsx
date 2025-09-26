'use client'

import { YStack } from '@app/ui'

import { DrawerContent, normalizePath } from './index'
import { usePathname } from '@app/core/utils/usePathname'

export const StaticDrawer = ({ onNavigate }: { onNavigate?: () => void } = {}) => {
  const pathname = normalizePath(usePathname())

  return (
    <YStack backgroundColor="$color1" flexShrink={0} height="100vh" px="$0">
      <DrawerContent pathname={pathname} onNavigate={() => onNavigate?.()} />
    </YStack>
  )
}

export default StaticDrawer
