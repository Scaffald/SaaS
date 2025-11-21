import { CheckCircle2, XCircle, AlertCircle } from '@tamagui/lucide-icons'
import type { FC } from 'react'
import { Text, XStack, YStack } from 'tamagui'

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
    <XStack gap="$3" items="center" py="$2">
      {/* Indicator Icon */}
      {meetsRequirement ? (
        <CheckCircle2 size={18} color="$green10" />
      ) : userRating !== null && userRating > 0 ? (
        <AlertCircle size={18} color="$yellow10" />
      ) : (
        <XCircle size={18} color="$red10" />
      )}

      {/* Skill Info */}
      <YStack flex={1} gap="$1">
        <Text fontSize="$3" fontWeight="600" color="$color12">
          {skillName}
        </Text>
        <XStack gap="$3" items="center">
          {userRating !== null && userRating > 0 ? (
            <Text fontSize="$2" color="$color11">
              Your rating: {userRating}/5
            </Text>
          ) : (
            <Text fontSize="$2" color="$color10" fontStyle="italic">
              Not assessed
            </Text>
          )}
          <Text fontSize="$2" color="$color10">
            Required: {requiredImportance}/5
          </Text>
        </XStack>
      </YStack>
    </XStack>
  )
}

