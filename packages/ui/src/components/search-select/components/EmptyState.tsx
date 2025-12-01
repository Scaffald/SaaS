import { Search } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { SizableText, YStack } from 'tamagui'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
}

export const EmptyState = ({
  title = 'No results found',
  description = 'Try a different search term or adjust your filters.',
  icon,
}: EmptyStateProps) => {
  return (
    <YStack p="$4" gap="$2" items="center" aria-live="polite">
      {icon ?? <Search size={28} color="$color9" aria-hidden={true} />}
      <SizableText fontSize="$4" fontWeight="600" style={{ textAlign: 'center' }}>
        {title}
      </SizableText>
      <SizableText fontSize="$2" color="$color11" style={{ textAlign: 'center' }}>
        {description}
      </SizableText>
    </YStack>
  )
}
