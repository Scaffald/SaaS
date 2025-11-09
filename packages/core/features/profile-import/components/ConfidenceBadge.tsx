import { memo } from 'react'
import { Caption, XStack, YStack } from 'tamagui'
import { ShieldAlert, ShieldCheck, ShieldQuestion } from '@tamagui/lucide-icons'
import { CONFIDENCE_BADGES, type ConfidenceLevel } from '../utils/importConfidence'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
  showDescription?: boolean
}

const ICON_MAP: Record<ConfidenceLevel, typeof ShieldCheck> = {
  high: ShieldCheck,
  medium: ShieldQuestion,
  low: ShieldAlert,
}

export const ConfidenceBadge = memo(function ConfidenceBadge({ level, showDescription = false }: ConfidenceBadgeProps) {
  const config = CONFIDENCE_BADGES[level]
  const Icon = ICON_MAP[level]

  return (
    <XStack gap="$2" items="center">
      <Icon size={16} color={config.colorToken} />
      <YStack>
        <Caption color={config.colorToken} fontWeight="600">
          {config.label}
        </Caption>
        {showDescription && (
          <Caption color="$color10">
            {config.description}
          </Caption>
        )}
      </YStack>
    </XStack>
  )
})


