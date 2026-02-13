import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native'
import type { FC } from 'react'
import { Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

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
export const SoftSkillsMatchIndicator: FC<SoftSkillsMatchIndicatorProps> = () => {
  const { theme } = useThemeContext()
{
  skillName,
  userRating,
  requiredImportance,
  meetsRequirement,
}) => {
  return (
    <Row gap={12} align="center" paddingVertical={8}>
      {/* Indicator Icon */}
      {meetsRequirement ? (
        <CheckCircle2 size={18} style={{ color: colors.text[theme].success }} />
      ) : userRating !== null && userRating > 0 ? (
        <AlertCircle size={18} color="$yellow10" />
      ) : (
        <XCircle size={18} style={{ color: colors.text[theme].error }} />
      )}

      {/* Skill Info */}
      <Stack flex={1} gap={4}>
        <Text style={{ color: colors.text[theme].secondary }}>{skillName}</Text>
        <Row gap={12} align="center">
          {userRating !== null && userRating > 0 ? (
            <Text style={{ color: colors.text[theme].secondary }}>Your rating: {userRating}/5</Text>
          ) : (
            <Text style={{ color: colors.text[theme].secondary }} fontStyle="italic">
              Not assessed
            </Text>
          )}
          <Text style={{ color: colors.text[theme].secondary }}>Required: {requiredImportance}/5</Text>
        </Row>
      </Stack>
    </Row>
  )
}
