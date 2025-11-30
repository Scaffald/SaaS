import { Award, BadgeCheck, Clock3, DollarSign, Star } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { forwardRef, memo } from 'react'
import type { TamaguiElement } from 'tamagui'
import { Paragraph, Text, XStack, useWindowDimensions } from 'tamagui'
import {
  CardBadges,
  CardHeader,
  CardMetadata,
  SelectableCard,
  type BadgeConfig,
  type MetadataItem,
} from '@scaffald/tamagui-ui'

/**
 * Profile card badge configuration
 */
export interface ProfileBadge {
  id: string
  label: string
  tone: 'success' | 'warning' | 'danger'
}

/**
 * Profile card props
 */
export interface ProfileCardProps {
  id: string
  name: string
  title: string
  score?: number
  experienceYears?: number
  hourlyRate?: number
  locationLabel?: string
  badges?: ProfileBadge[]
  certifications?: string[]
  skills?: string[]
  isSelected?: boolean
  onSelect: (id: string) => void
  avatar?: ReactNode
}

/**
 * ProfileCard - Displays worker/candidate profile information
 *
 * Based on the ResultCard gold standard with selection states,
 * hover effects, and comprehensive profile data display.
 *
 * @example
 * ```tsx
 * <ProfileCard
 *   id="profile-1"
 *   name="John Doe"
 *   title="Senior Engineer"
 *   score={95}
 *   experienceYears={8}
 *   hourlyRate={125}
 *   locationLabel="San Francisco, CA"
 *   isSelected={selected === "profile-1"}
 *   onSelect={setSelected}
 * />
 * ```
 */
export const ProfileCard = memo(
  forwardRef<TamaguiElement, ProfileCardProps>(
    (
      {
        id,
        name,
        title,
        score,
        experienceYears,
        hourlyRate,
        locationLabel,
        badges = [],
        certifications = [],
        skills = [],
        isSelected = false,
        onSelect,
        avatar,
      },
      forwardedRef
    ) => {
      // Use window dimensions for text truncation behavior
      // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
      const dimensions = useWindowDimensions()
      const titleNumberOfLines = dimensions.width <= 800 ? 3 : 2
      // Build metadata items
      const metadataItems: MetadataItem[] = []

      if (experienceYears) {
        metadataItems.push({
          key: 'experience',
          icon: <Clock3 size={14} color={isSelected ? '$color1' : '$color10'} />,
          label: `${experienceYears} years`,
        })
      }

      if (hourlyRate) {
        metadataItems.push({
          key: 'rate',
          icon: <DollarSign size={14} color={isSelected ? '$color1' : '$color10'} />,
          label: `$${hourlyRate}/hr`,
        })
      }

      if (locationLabel) {
        metadataItems.push({
          key: 'location',
          icon: <Award size={14} color={isSelected ? '$color1' : '$color10'} />,
          label: locationLabel,
        })
      }

      // Build badge configs for profile badges
      const profileBadgeConfigs: BadgeConfig[] = badges.slice(0, 3).map((badge) => ({
        key: badge.id,
        label: badge.label,
        bg: badge.tone === 'success' ? '$green3' : badge.tone === 'warning' ? '$yellow3' : '$red3',
        color:
          badge.tone === 'success' ? '$green11' : badge.tone === 'warning' ? '$yellow11' : '$red11',
        icon:
          badge.tone === 'success' ? (
            <BadgeCheck size={12} color="$green11" />
          ) : (
            <Award size={12} color={badge.tone === 'warning' ? '$yellow11' : '$red11'} />
          ),
      }))

      // Add overflow indicator if needed
      if (badges.length > 3) {
        profileBadgeConfigs.push({
          key: 'overflow',
          label: `+${badges.length - 3} more`,
          bg: 'transparent',
          color: isSelected ? '$color1' : '$color10',
        })
      }

      // Build badge configs for skills and certifications
      const skillBadges: BadgeConfig[] = [
        ...certifications.slice(0, 2).map((cert, idx) => ({
          key: `cert-${idx}`,
          label: cert,
          bg: '$red10',
          color: '$color1',
        })),
        ...skills.slice(0, 3).map((skill, idx) => ({
          key: `skill-${idx}`,
          label: skill,
          bg: '$blue8',
          color: '$color1',
        })),
      ]

      const totalSkillsAndCerts = certifications.length + skills.length
      const displayedSkillsAndCerts = 5
      if (totalSkillsAndCerts > displayedSkillsAndCerts) {
        skillBadges.push({
          key: 'skills-overflow',
          label: `+${totalSkillsAndCerts - displayedSkillsAndCerts} more`,
          bg: '$color3',
          color: '$color11',
        })
      }

      return (
        <SelectableCard
          ref={forwardedRef}
          id={id}
          isSelected={isSelected}
          onPress={() => onSelect(id)}
          selection={{
            enabled: true,
            selectedBorderColor: '$blue7',
            selectedBgColor: '$blue2',
            selectedShadow: '0 4px 8px rgba(35, 156, 178, 0.2)',
          }}
        >
          {/* Header with score badge */}
          <XStack justify="space-between" items="center">
            <CardHeader title={name} isSelected={isSelected} icon={avatar} />
            {score && (
              <XStack items="center" gap="$1" bg="$blue3" rounded="$4" px="$2" py="$1">
                <Star size={12} color="$blue11" />
                <Text color="$blue11" fontWeight="700" fontSize="$2">
                  {score}
                </Text>
              </XStack>
            )}
          </XStack>

          {/* Title/Role */}
          <Paragraph
            size="$3"
            color={isSelected ? '$color1' : '$color11'}
            numberOfLines={titleNumberOfLines}
          >
            {title}
          </Paragraph>

          {/* Metadata */}
          {metadataItems.length > 0 && (
            <CardMetadata items={metadataItems} isSelected={isSelected} />
          )}

          {/* Profile badges (certifications, achievements, etc.) */}
          {profileBadgeConfigs.length > 0 && (
            <XStack gap="$1" flexWrap="wrap">
              {profileBadgeConfigs.map((badgeConfig) => (
                <XStack
                  key={badgeConfig.key}
                  items="center"
                  gap="$1"
                  px="$1"
                  py="$0.5"
                  rounded="$8"
                  bg={
                    badgeConfig.bg as typeof badgeConfig.bg extends string
                      ? typeof badgeConfig.bg
                      : never
                  }
                >
                  {badgeConfig.icon}
                  <Text
                    fontSize="$1"
                    color={
                      badgeConfig.color as typeof badgeConfig.color extends string
                        ? typeof badgeConfig.color
                        : never
                    }
                  >
                    {badgeConfig.label}
                  </Text>
                </XStack>
              ))}
            </XStack>
          )}

          {/* Skills and certifications */}
          {skillBadges.length > 0 && <CardBadges badges={skillBadges} isSelected={isSelected} />}
        </SelectableCard>
      )
    }
  )
)

ProfileCard.displayName = 'ProfileCard'
