import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { DiscoverCard } from '@unicornlove/ui'
import { Award, BadgeCheck, Clock3, DollarSign, Star } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { forwardRef, memo } from 'react'
import type { TamaguiElement } from '@unicornlove/ui'
import { Button, Paragraph, SizableText, Text, XStack } from '@unicornlove/ui'

import type { TalentProfile } from '../types'

type ResultCardProps = {
  profile: TalentProfile
  isSelected?: boolean
  onSelect: (profileId: string) => void
}

export const ResultCard = memo(
  forwardRef<TamaguiElement, ResultCardProps>(({ profile, isSelected, onSelect }, forwardedRef) => {
    const router = useRouter()
    const toast = useToastController()

    const handleCardPress = () => {
      // Notify parent component about selection
      onSelect(profile.id)

      // Navigate to detail page
      try {
        router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.WORKERS.DETAIL, { id: profile.id }))
      } catch (navigationError) {
        console.error('Failed to navigate to worker profile', navigationError)
        toast.show('Unable to load profile', {
          message: 'Please try again.',
        })
      }
    }

    return (
      <DiscoverCard
        ref={forwardedRef}
        variant="info"
        isSelected={isSelected}
        onPress={handleCardPress}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <SizableText size="$5" fontWeight="700" color={isSelected ? '$color1' : '$color12'}>
            {profile.name}
          </SizableText>
          <XStack alignItems="center" gap="$2">
            <XStack
              alignItems="center"
              gap="$1"
              backgroundColor="$blue3"
              borderRadius="$4"
              paddingHorizontal="$2"
              paddingVertical="$1"
            >
              <Star size={12} color="$blue11" />
              <Text color="$blue11" fontWeight="700" fontSize="$2">
                {profile.score}
              </Text>
            </XStack>
          </XStack>
        </XStack>

        <Paragraph size="$3" color={isSelected ? '$color1' : '$color11'} numberOfLines={2}>
          {profile.title}
        </Paragraph>

        <XStack flexWrap="wrap" gap="$2">
          <XStack alignItems="center" gap="$1">
            <Clock3 size={14} color={isSelected ? '$color1' : '$color10'} />
            <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
              {profile.experienceYears} years
            </Text>
          </XStack>
          {profile.hourlyRate ? (
            <XStack alignItems="center" gap="$1">
              <DollarSign size={14} color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
                ${profile.hourlyRate}/hr
              </Text>
            </XStack>
          ) : null}
          <XStack alignItems="center" gap="$1">
            <Award size={14} color={isSelected ? '$color1' : '$color10'} />
            <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
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
            <Button key={certification} size="$1" borderRadius="$8">
              {certification}
            </Button>
          ))}
          {profile.skills.slice(0, 3).map((skill) => (
            <Button key={skill} size="$1" borderRadius="$8">
              {skill}
            </Button>
          ))}
          {(profile.certifications.length > 2 || profile.skills.length > 3) && (
            <Text fontSize="$1" color="$color10">
              +{profile.certifications.length - 2 + profile.skills.length - 3} more
            </Text>
          )}
        </XStack>
      </DiscoverCard>
    )
  })
)

ResultCard.displayName = 'ResultCard'
