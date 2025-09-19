import { memo } from 'react'
import { Button, Paragraph, SizableText, Text, XStack, YStack } from '@my/ui'
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
      borderRadius="$4"
      padding="$4"
      backgroundColor={isSelected ? '$blue2' : '$background'}
      gap="$3"
      pressStyle={{ scale: 0.98 }}
      hoverStyle={{ backgroundColor: '$color2' }}
      onPress={() => onSelect(profile.id)}
    >
      <XStack justifyContent="space-between" alignItems="center">
        <SizableText size="$6" fontWeight="700">
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

      <Paragraph size="$3" color="$color11">
        {profile.title}
      </Paragraph>

      <XStack flexWrap="wrap" gap="$3">
        <XStack alignItems="center" gap="$2">
          <Clock3 size={16} color="$color10" />
          <Text color="$color11">{profile.experienceYears} years experience</Text>
        </XStack>
        {profile.hourlyRate ? (
          <XStack alignItems="center" gap="$2">
            <DollarSign size={16} color="$color10" />
            <Text color="$color11">${profile.hourlyRate}/hr</Text>
          </XStack>
        ) : null}
        <XStack alignItems="center" gap="$2">
          <Award size={16} color="$color10" />
          <Text color="$color11">{profile.locationLabel}</Text>
        </XStack>
      </XStack>

      <XStack gap="$2" flexWrap="wrap">
        {profile.badges.map((badge) => (
          <XStack
            key={badge.id}
            alignItems="center"
            gap="$1"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$10"
            backgroundColor={
              badge.tone === 'success' ? '$green3' : badge.tone === 'warning' ? '$yellow3' : '$red3'
            }
          >
            {badge.tone === 'success' ? (
              <BadgeCheck size={14} color="$green11" />
            ) : badge.tone === 'warning' ? (
              <Award size={14} color="$yellow11" />
            ) : (
              <Award size={14} color="$red11" />
            )}
            <Text
              fontSize="$2"
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
      </XStack>

      <XStack gap="$2" flexWrap="wrap">
        {profile.certifications.map((certification) => (
          <Button key={certification} size="$2" theme="surface2" borderRadius="$10">
            {certification}
          </Button>
        ))}
        {profile.skills.map((skill) => (
          <Button key={skill} size="$2" theme="gray" borderRadius="$10">
            {skill}
          </Button>
        ))}
      </XStack>
    </YStack>
  )
})

ResultCard.displayName = 'ResultCard'
