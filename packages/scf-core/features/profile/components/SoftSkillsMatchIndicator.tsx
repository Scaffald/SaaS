import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native'
import type { FC } from 'react'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'

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
  return (
    <Row gap={12} align="center" paddingVertical={8}>
      {/* Indicator Icon */}
      {meetsRequirement ? (
        <CheckCircle2 size={18} color="$green10" />
      ) : userRating !== null && userRating > 0 ? (
        <AlertCircle size={18} color="$yellow10" />
      ) : (
        <XCircle size={18} color="$red10" />
      )}

      {/* Skill Info */}
      <Stack flex={1} gap={4}>
        <Text color="gray">{skillName}</Text>
        <Row gap={12} align="center">
          {userRating !== null && userRating > 0 ? (
            <Text color="gray">Your rating: {userRating}/5</Text>
          ) : (
            <Text color="gray" fontStyle="italic">
              Not assessed
            </Text>
          )}
          <Text color="gray">Required: {requiredImportance}/5</Text>
        </Row>
      </Stack>
    </Row>
  )
}
