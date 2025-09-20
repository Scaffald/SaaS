'use client'

import { YStack } from '@my/ui'

import { DrawerContent, normalizePath } from './index'
import { usePathname } from 'app/utils/usePathname'

export const StaticDrawer = ({ onNavigate }: { onNavigate?: () => void } = {}) => {
  const pathname = normalizePath(usePathname())

  return (
    <YStack f={1} h="100%" ai="center" backgroundColor="$color1">
      <DrawerContent pathname={pathname} onNavigate={() => onNavigate?.()} />
    </YStack>
  )
}

export default StaticDrawer
