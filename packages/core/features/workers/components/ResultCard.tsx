import { memo, forwardRef } from 'react'
import { Button, Paragraph, SizableText, Text, XStack, YStack, Chip } from '@app/ui'
import { Award, BadgeCheck, Building, Clock3, DollarSign, Star } from '@tamagui/lucide-icons'

import type { TalentProfile } from '../types'

type ResultCardProps = {
  profile: TalentProfile
  isSelected?: boolean
  onSelect: (profileId: string) => void
}

export const ResultCard = memo(
  forwardRef<unknown, ResultCardProps>(({ profile, isSelected, onSelect }, ref) => {
    return (
      <YStack
        ref={ref}
        borderWidth={1}
        borderColor={isSelected ? '$blue7' : '$color5'}
        borderRadius="$3"
        padding="$3"
        backgroundColor={isSelected ? '$blue2' : '$background'}
        gap="$2"
        pressStyle={{ scale: 0.98 }}
        hoverStyle={{ backgroundColor: '$color2' }}
        onPress={() => onSelect(profile.id)}
        // Add animation for selection highlight
        animation={isSelected ? 'bouncy' : undefined}
        animateOnly={['backgroundColor', 'borderColor']}
        // Add subtle shadow when selected
        shadowColor={isSelected ? '$blue7' : undefined}
        shadowOffset={isSelected ? { width: 0, height: 2 } : undefined}
        shadowOpacity={isSelected ? 0.1 : undefined}
        shadowRadius={isSelected ? 4 : undefined}
        elevation={isSelected ? 2 : undefined}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <SizableText size="$5" fontWeight="700">
            {profile.name}
          </SizableText>
          <XStack alignItems="center" gap="$2">
            <Chip backgroundColor="$blue3" rounded theme="blue" size="$3">
              <Chip.Icon color="$blue11">
                <Star />
              </Chip.Icon>
              <Chip.Text color="$blue11" fontWeight="700">
                {profile.score}
              </Chip.Text>
            </Chip>
            {profile.organization === 'Organization' ? (
              <Building size={16} color="$blue11" />
            ) : null}
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
                badge.tone === 'success'
                  ? '$green3'
                  : badge.tone === 'warning'
                    ? '$yellow3'
                    : '$red3'
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
)

ResultCard.displayName = 'ResultCard'
