import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { DiscoverCard } from '@scaffald/ui'
import { Award, BadgeCheck, Clock3, DollarSign, Star } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import { Button, Paragraph, SizableText, Text, Row } from '@scaffald/ui'

import type { TalentProfile } from '../types'

type ResultCardProps = {
  profile: TalentProfile
  isSelected?: boolean
  onSelect: (profileId: string) => void
}

export const ResultCard = memo(
  forwardRef<ComponentRef<typeof DiscoverCard>, ResultCardProps>(
    ({ profile, isSelected, onSelect }, forwardedRef) => {
      const router = useRouter()
      const toast = useToast()

      const handleCardPress = () => {
        // Notify parent component about selection
        onSelect(profile.id)

        // Navigate to detail page
        try {
          router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.WORKERS.DETAIL, { id: profile.id }))
        } catch (navigationError) {
          console.error('Failed to navigate to worker profile', navigationError)
          toast.show({
            title: 'Unable to load profile',
            message: 'Please try again.',
            variant: 'error',
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
          <Row justify="space-between" align="center">
            <SizableText size="lg" color={isSelected ? '$color1' : '$color12'}>
              {profile.name}
            </SizableText>
            <Row align="center" gap={8}>
              <Row
                align="center"
                gap={4}
                backgroundColor="$blue3"
                borderRadius={16}
                paddingHorizontal={8}
                paddingVertical={4}
              >
                <Star size="sm" color="$blue11" />
                <Text color="$blue11">{profile.score}</Text>
              </Row>
            </Row>
          </Row>

          <Paragraph size="sm" color={isSelected ? '$color1' : '$color11'}>
            {profile.title}
          </Paragraph>

          <Row flexWrap="wrap" gap={8}>
            <Row align="center" gap={4}>
              <Clock3 size="md" color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'}>
                {profile.experienceYears} years
              </Text>
            </Row>
            {profile.hourlyRate ? (
              <Row align="center" gap={4}>
                <DollarSign size="md" color={isSelected ? '$color1' : '$color10'} />
                <Text color={isSelected ? '$color1' : '$color11'}>${profile.hourlyRate}/hr</Text>
              </Row>
            ) : null}
            <Row align="center" gap={4}>
              <Award size="md" color={isSelected ? '$color1' : '$color10'} />
              <Text color={isSelected ? '$color1' : '$color11'}>{profile.locationLabel}</Text>
            </Row>
          </Row>

          <Row gap={4} flexWrap="wrap">
            {profile.badges.slice(0, 3).map((badge) => (
              <Row
                key={badge.id}
                align="center"
                gap={4}
                paddingHorizontal={4}
                paddingVertical={2}
                borderRadius={32}
                backgroundColor={
                  badge.tone === 'success'
                    ? '$green3'
                    : badge.tone === 'warning'
                      ? '$yellow3'
                      : '$red3'
                }
              >
                {badge.tone === 'success' ? (
                  <BadgeCheck size="sm" color="$green11" />
                ) : badge.tone === 'warning' ? (
                  <Award size="sm" color="$yellow11" />
                ) : (
                  <Award size="sm" color="$red11" />
                )}
                <Text
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
              </Row>
            ))}
            {profile.badges.length > 3 && (
              <Text color="$gray11">+{profile.badges.length - 3} more</Text>
            )}
          </Row>

          <Row gap={4} flexWrap="wrap">
            {profile.certifications.slice(0, 2).map((certification) => (
              <Button key={certification} size={4} borderRadius={32}>
                {certification}
              </Button>
            ))}
            {profile.skills.slice(0, 3).map((skill) => (
              <Button key={skill} size={4} borderRadius={32}>
                {skill}
              </Button>
            ))}
            {(profile.certifications.length > 2 || profile.skills.length > 3) && (
              <Text color="$gray11">
                +{profile.certifications.length - 2 + profile.skills.length - 3} more
              </Text>
            )}
          </Row>
        </DiscoverCard>
      )
    }
  )
)

ResultCard.displayName = 'ResultCard'
