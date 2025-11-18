import { memo, forwardRef, Ref } from 'react'
import type { TamaguiElement } from 'tamagui'
import { Button, Paragraph, SizableText, Text, XStack, YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { RouteBuilder } from '@app/core/constants/routes'
import { Award, BadgeCheck, Clock3, DollarSign, ExternalLink, Star } from '@tamagui/lucide-icons'

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

    const handleViewFullProfile = () => {
      onSelect(profile.id)
      try {
        router.push(RouteBuilder.discoverWorkerDetail(profile.id))
      } catch (navigationError) {
        console.error('Failed to navigate to worker profile', navigationError)
        toast.show('Unable to load profile', {
          message: 'Please try again.',
        })
      }
    }

    return (
      <YStack
        ref={(node) => {
          // Forward to parent ref
          if (typeof forwardedRef === 'function') {
            forwardedRef(node)
          } else if (forwardedRef) {
            forwardedRef.current = node
          }
        }}
        borderWidth={1}
        borderColor={isSelected ? '$blue9' : '$color5'}
        rounded="$3"
        p="$3"
        bg={isSelected ? '$blue9' : '$background'}
        gap="$2"
        width="100%"
        pressStyle={{ scale: 0.98 }}
        hoverStyle={{ bg: isSelected ? '$blue9' : '$color2' }}
        onPress={() => onSelect(profile.id)}
        // Add animation for selection highlight
        animation={isSelected ? 'bouncy' : undefined}
        animateOnly={['backgroundColor', 'borderColor']}
        // Add subtle shadow when selected
        style={isSelected ? { boxShadow: '0 4px 8px rgba(59, 130, 246, 0.2)' } : undefined}
      >
        <XStack justify="space-between" items="center">
          <SizableText size="$5" fontWeight="700" color={isSelected ? '$color1' : '$color12'}>
            {profile.name}
          </SizableText>
          <XStack items="center" gap="$2">
            <XStack items="center" gap="$1" bg="$blue3" rounded="$4" px="$2" py="$1">
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
          <XStack items="center" gap="$1">
            <Clock3 size={14} color={isSelected ? '$color1' : '$color10'} />
            <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
              {profile.experienceYears} years
            </Text>
          </XStack>
          {profile.hourlyRate ? (
            <XStack items="center" gap="$1">
              <DollarSign size={14} color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'} fontSize="$2">
                ${profile.hourlyRate}/hr
              </Text>
            </XStack>
          ) : null}
          <XStack items="center" gap="$1">
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
              items="center"
              gap="$1"
              px="$1"
              py="$0.5"
              rounded="$8"
              bg={
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
            <Button key={certification} size="$1" rounded="$8">
              {certification}
            </Button>
          ))}
          {profile.skills.slice(0, 3).map((skill) => (
            <Button key={skill} size="$1" rounded="$8">
              {skill}
            </Button>
          ))}
          {(profile.certifications.length > 2 || profile.skills.length > 3) && (
            <Text fontSize="$1" color="$color10">
              +{profile.certifications.length - 2 + profile.skills.length - 3} more
            </Text>
          )}
        </XStack>

        <Button
          mt="$2"
          theme="info"
          size="$2"
          iconAfter={ExternalLink}
          onPress={handleViewFullProfile}
        >
          View Full Profile
        </Button>
      </YStack>
    )
  })
)

ResultCard.displayName = 'ResultCard'
