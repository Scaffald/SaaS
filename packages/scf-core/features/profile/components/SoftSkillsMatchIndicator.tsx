import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native'
import type { FC } from 'react'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export interface SoftSkillsMatchIndicatorProps {
  skillName: string
  userRating: number | null
  requiredImportance: number
  meetsRequirement: boolean
}

/**
 * SoftSkillsMatchIndicator component
 *
 * Displays a single soft skill match indicator with skill name,
 * user rating, required importance, and visual indicator.
 */
export const SoftSkillsMatchIndicator: FC<SoftSkillsMatchIndicatorProps> = ({
  skillName,
  userRating,
  requiredImportance,
  meetsRequirement,
}) => {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Row gap={12} align="center" paddingVertical={8}>
      {/* Indicator Icon */}
      {meetsRequirement ? (
        <CheckCircle2 size={18} color={t === 'dark' ? colors.green[300] : colors.green[600]} />
      ) : userRating !== null && userRating > 0 ? (
        <AlertCircle size={18} color={t === 'dark' ? colors.yellow[300] : colors.yellow[600]} />
      ) : (
        <XCircle size={18} color={t === 'dark' ? colors.error[300] : colors.error[600]} />
      )}

      {/* Skill Info */}
      <Stack flex={1} gap={4}>
        <Text style={{ color: colors.text[t].secondary }}>{skillName}</Text>
        <Row gap={12} align="center">
          {userRating !== null && userRating > 0 ? (
            <Text style={{ color: colors.text[t].secondary }}>Your rating: {userRating}/5</Text>
          ) : (
            <Text style={{ color: colors.text[t].secondary, fontStyle: 'italic' }}>
              Not assessed
            </Text>
          )}
          <Text style={{ color: colors.text[t].secondary }}>Required: {requiredImportance}/5</Text>
        </Row>
      </Stack>
    </Row>
  )
}
