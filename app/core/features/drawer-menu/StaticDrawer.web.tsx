'use client'

import { YStack } from '@app/ui'

import { DrawerContent, normalizePath } from './index'
import { usePathname } from '@app/core/utils/usePathname'

export const StaticDrawer = ({ onNavigate }: { onNavigate?: () => void } = {}) => {
  const pathname = normalizePath(usePathname())

  return (
    <YStack
      width={320}
      maxWidth={320}
      height="100vh"
      backgroundColor="$color1"
      flexShrink={0}
      overflow="hidden"
    >
      <YStack flex={1} overflow="auto">
        <DrawerContent pathname={pathname} onNavigate={() => onNavigate?.()} />
      </YStack>
    </YStack>
  )
}

export default StaticDrawer
