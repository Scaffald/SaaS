import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react-native'
import { memo } from 'react'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'
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

export const ConfidenceBadge = memo(function ConfidenceBadge({
  level,
  showDescription = false,
}: ConfidenceBadgeProps) {
  const config = CONFIDENCE_BADGES[level]
  const Icon = ICON_MAP[level]

  return (
    <Row gap={8} align="center">
      <Icon size={16} color={config.colorToken} />
      <Stack>
        <Text color={config.colorToken}>{config.label}</Text>
        {showDescription && <Text color="gray">{config.description}</Text>}
      </Stack>
    </Row>
  )
})
