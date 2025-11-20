import type { ReactNode } from 'react'
import { YStack } from 'tamagui'

import { type UseQuickLinksOptions, useQuickLinks } from '../../hooks/useQuickLinks'

export type QuickLinksSidebarProps = UseQuickLinksOptions & {
  children?: ReactNode
  gap?: Parameters<typeof YStack>[0]['gap']
}

export const QuickLinksSidebar = ({ children, gap = '$4', ...options }: QuickLinksSidebarProps) => {
  const quickLinks = useQuickLinks(options)

  if (!quickLinks && !children) {
    return null
  }

  if (!quickLinks) {
    return <YStack gap={gap}>{children}</YStack>
  }

  if (!children) {
    return <YStack gap={gap}>{quickLinks}</YStack>
  }

  return (
    <YStack gap={gap}>
      {quickLinks}
      {children}
    </YStack>
  )
}
