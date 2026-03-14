import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react-native'
import { memo } from 'react'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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

export const ConfidenceBadge = memo(function ConfidenceBadgeInner({
  level,
  showDescription = false,
}: ConfidenceBadgeProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const config = CONFIDENCE_BADGES[level]
  const Icon = ICON_MAP[level]

  return (
    <Row gap={8} align="center">
      <Icon size="md" color={config.colorToken as string} />
      <Stack>
        <Text style={{ color: config.colorToken }}>{config.label}</Text>
        {showDescription && <Text style={{ color: colors.text[t].secondary }}>{config.description}</Text>}
      </Stack>
    </Row>
  )
})
