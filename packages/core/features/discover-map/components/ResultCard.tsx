import { memo } from 'react'
import { Button, Paragraph, SizableText, Text, XStack, YStack } from '@app/ui'
import { Award, BadgeCheck, Building, Clock3, DollarSign } from '@tamagui/lucide-icons'

import type { TalentProfile } from '../types'

type ResultCardProps = {
  profile: TalentProfile
  isSelected: boolean
  onSelect: (profileId: string) => void
}

export const ResultCard = memo(({ profile, isSelected, onSelect }: ResultCardProps) => {
  return (
    <YStack
      borderWidth={1}
      borderColor={isSelected ? '$blue7' : '$color5'}
      borderRadius="$3"
      padding="$3"
      backgroundColor={isSelected ? '$blue2' : '$background'}
      gap="$2"
      pressStyle={{ scale: 0.98 }}
      hoverStyle={{ backgroundColor: '$color2' }}
      onPress={() => onSelect(profile.id)}
    >
      <XStack justifyContent="space-between" alignItems="center">
        <SizableText size="$5" fontWeight="700">
          {profile.name}
        </SizableText>
        <XStack alignItems="center" gap="$2">
          <XStack
            backgroundColor="$blue3"
            borderRadius="$6"
            paddingHorizontal="$2"
            paddingVertical="$1"
            alignItems="center"
            gap="$1"
          >
            <Text fontSize="$2" color="$blue11" fontWeight="700">
              e {profile.score}
            </Text>
            {profile.scoreLabel ? (
              <Text fontSize="$2" color="$blue11">
                {profile.scoreLabel}
              </Text>
            ) : null}
          </XStack>
          {profile.organization === 'Organization' ? <Building size={16} color="$blue11" /> : null}
        </XStack>
      </XStack>

      <Paragraph size="$3" color="$color11" numberOfLines={2}>
        {profile.title}
      </Paragraph>

      <XStack flexWrap="wrap" gap="$2">
        <XStack alignItems="center" gap="$1">
          <Clock3 size={14} color="$color10" />
          <Text color="$color11" fontSize="$2">
            {profile.experienceYears} years
          </Text>
        </XStack>
        {profile.hourlyRate ? (
          <XStack alignItems="center" gap="$1">
            <DollarSign size={14} color="$color10" />
            <Text color="$color11" fontSize="$2">
              ${profile.hourlyRate}/hr
            </Text>
          </XStack>
        ) : null}
        <XStack alignItems="center" gap="$1">
          <Award size={14} color="$color10" />
          <Text color="$color11" fontSize="$2">
            {profile.locationLabel}
          </Text>
        </XStack>
      </XStack>

      <XStack gap="$1" flexWrap="wrap">
        {profile.badges.slice(0, 3).map((badge) => (
          <XStack
            key={badge.id}
            alignItems="center"
            gap="$1"
            paddingHorizontal="$1"
            paddingVertical="$0.5"
            borderRadius="$8"
            backgroundColor={
              badge.tone === 'success' ? '$green3' : badge.tone === 'warning' ? '$yellow3' : '$red3'
            }
          >
            {badge.tone === 'success' ? (
              <BadgeCheck size={12} color="$green11" />
            ) : badge.tone === 'warning' ? (
              <Award size={12} color="$yellow11" />
            ) : (
              <Award size={12} color="$red11" />
            )}
            <Text
              fontSize="$1"
              color={
                badge.tone === 'success'
                  ? '$green11'
                  : badge.tone === 'warning'
                    ? '$yellow11'
                    : '$red11'
              }
            >
              {badge.label}
            </Text>
          </XStack>
        ))}
        {profile.badges.length > 3 && (
          <Text fontSize="$1" color="$color10">
            +{profile.badges.length - 3} more
          </Text>
        )}
      </XStack>

      <XStack gap="$1" flexWrap="wrap">
        {profile.certifications.slice(0, 2).map((certification) => (
          <Button key={certification} size="$1" theme="surface2" borderRadius="$8">
            {certification}
          </Button>
        ))}
        {profile.skills.slice(0, 3).map((skill) => (
          <Button key={skill} size="$1" theme="gray" borderRadius="$8">
            {skill}
          </Button>
        ))}
        {(profile.certifications.length > 2 || profile.skills.length > 3) && (
          <Text fontSize="$1" color="$color10">
            +{profile.certifications.length - 2 + profile.skills.length - 3} more
          </Text>
        )}
      </XStack>
    </YStack>
  )
})

ResultCard.displayName = 'ResultCard'
