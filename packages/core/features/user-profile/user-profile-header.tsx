import { YStack, XStack, Text, Card, Button } from 'tamagui'
import { Star, MapPin, Award, DollarSign, Briefcase, MessageSquare } from '@tamagui/lucide-icons'

interface UserProfileHeaderProps {
  profile: {
    name: string | null
    avatar_url: string | null
    headline: string | null
    industry_name: string | null
    years_of_experience: number | null
    calculatedYearsOfExperience?: number | null
    gamified_score: number | null
    location: string | null
    hourly_rate_cents: number | null
    open_to_work: boolean | null
  }
  onLeaveReview?: () => void
  canLeaveReview?: boolean
}

/**
 * User Profile Header
 * Shows avatar, name, headline, score, and key stats
 */
export function UserProfileHeader({
  profile,
  onLeaveReview,
  canLeaveReview,
}: UserProfileHeaderProps) {
  const formatHourlyRate = (cents: number | null) => {
    if (!cents) return null
    const dollars = cents / 100
    return `$${dollars.toFixed(2)}/hr`
  }

  const resolvedYears =
    typeof profile.calculatedYearsOfExperience === 'number'
      ? profile.calculatedYearsOfExperience
      : profile.years_of_experience

  const formattedYears =
    typeof resolvedYears === 'number' && !Number.isNaN(resolvedYears)
      ? resolvedYears % 1 !== 0
        ? resolvedYears.toFixed(1)
        : resolvedYears
      : null

  return (
    <Card elevate bordered>
      <YStack gap="$4" p="$5">
        {/* Header Row */}
        <XStack gap="$4" items="center" flexWrap="wrap" justify="space-between">
          <XStack gap="$4" items="center" flexWrap="wrap" flex={1}>
            {/* Avatar */}
            {profile.avatar_url ? (
              <YStack width={120} height={120} rounded="$10" overflow="hidden" bg="$color3">
                <img
                  src={profile.avatar_url}
                  alt={profile.name || 'User'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </YStack>
            ) : (
              <YStack
                width={120}
                height={120}
                rounded="$10"
                bg="$blue4"
                items="center"
                justify="center"
              >
                <Text fontSize="$10" fontWeight="700" color="$blue10">
                  {profile.name?.charAt(0) || '?'}
                </Text>
              </YStack>
            )}

            {/* Name and Headline */}
            <YStack flex={1} gap="$2" minW={200}>
              <Text fontSize="$10" fontWeight="700" color="$color12">
                {profile.name}
              </Text>
              {profile.headline && (
                <Text fontSize="$6" color="$color11">
                  {profile.headline}
                </Text>
              )}
              {profile.industry_name && (
                <XStack gap="$2" items="center">
                  <Briefcase size={18} color="$color10" />
                  <Text fontSize="$4" color="$color10">
                    {profile.industry_name}
                  </Text>
                </XStack>
              )}
            </YStack>

            {/* Scaffald Score */}
            {profile.gamified_score !== null && (
              <XStack
                bg="$blue2"
                px="$5"
                py="$3"
                rounded="$4"
                gap="$2"
                items="center"
                borderWidth={2}
                borderColor="$blue6"
              >
                <Star size={32} color="$blue10" fill="$blue10" />
                <YStack>
                  <Text fontSize="$9" fontWeight="700" color="$blue11">
                    {profile.gamified_score}
                  </Text>
                  <Text fontSize="$2" color="$blue10">
                    Scaffald Score
                  </Text>
                </YStack>
              </XStack>
            )}
          </XStack>

          {/* Leave Review Button */}
          {canLeaveReview && onLeaveReview && (
            <Button size="$4" theme="info" icon={MessageSquare} onPress={onLeaveReview}>
              Leave Review
            </Button>
          )}
        </XStack>

        {/* Stats Row */}
        <XStack gap="$4" flexWrap="wrap">
          {profile.location && (
            <XStack gap="$2" items="center" px="$3" py="$2" bg="$color2" rounded="$3">
              <MapPin size={18} color="$color11" />
              <Text fontSize="$4" color="$color11" fontWeight="600">
                {profile.location}
              </Text>
            </XStack>
          )}

          {formattedYears !== null && (
            <XStack gap="$2" items="center" px="$3" py="$2" bg="$color2" rounded="$3">
              <Award size={18} color="$color11" />
              <Text fontSize="$4" color="$color11" fontWeight="600">
                {formattedYears} years experience
              </Text>
            </XStack>
          )}

          {profile.hourly_rate_cents && (
            <XStack gap="$2" items="center" px="$3" py="$2" bg="$color2" rounded="$3">
              <DollarSign size={18} color="$color11" />
              <Text fontSize="$4" color="$color11" fontWeight="600">
                {formatHourlyRate(profile.hourly_rate_cents)}
              </Text>
            </XStack>
          )}

          {profile.open_to_work && (
            <XStack px="$3" py="$2" bg="$green3" rounded="$3">
              <Text fontSize="$4" fontWeight="600" color="$green11">
                ✓ Available for Work
              </Text>
            </XStack>
          )}
        </XStack>
      </YStack>
    </Card>
  )
}
