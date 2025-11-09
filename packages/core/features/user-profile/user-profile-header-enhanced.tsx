import { YStack, XStack, Text, Button, Card, Avatar, Image } from 'tamagui'
import { Star, MapPin, Award, DollarSign, Briefcase, MessageSquare, Edit3, Share2, MoreVertical } from '@tamagui/lucide-icons'
import { useWindowDimensions } from 'tamagui'
import { getStorageUrl } from '@app/core/utils/supabase/storage'

interface UserProfileHeaderEnhancedProps {
  profile: {
    id: string
    name: string | null
    avatar_url: string | null
    avatar_path: string | null
    headline: string | null
    industry_name: string | null
    years_of_experience: number | null
    gamified_score: number | null
    location: string | null
    hourly_rate_cents: number | null
    open_to_work: boolean | null
    banner_url?: string | null
    banner_path?: string | null
  }
  onLeaveReview?: () => void
  canLeaveReview?: boolean
  isOwnProfile?: boolean
  onEdit?: () => void
}

/**
 * Enhanced User Profile Header with LinkedIn-inspired layout
 * Features:
 * - Large banner image at top
 * - Avatar overlay on banner
 * - Profile name and title prominently displayed
 * - Action buttons (Edit, Share, etc.)
 * - Responsive design for mobile and desktop
 */
export function UserProfileHeaderEnhanced({
  profile,
  onLeaveReview,
  canLeaveReview,
  isOwnProfile = false,
  onEdit,
}: UserProfileHeaderEnhancedProps) {
  const { width } = useWindowDimensions()
  const isMobile = width < 768

  const formatHourlyRate = (cents: number | null) => {
    if (!cents) return null
    const dollars = cents / 100
    return `$${dollars.toFixed(2)}/hr`
  }

  // Get banner URL
  const bannerUrl = profile.banner_path
    ? getStorageUrl('avatars', profile.banner_path.replace('avatars/', ''))
    : profile.banner_url || null

  // Get avatar URL
  const avatarUrl = profile.avatar_path
    ? getStorageUrl('avatars', profile.avatar_path)
    : profile.avatar_url || null

  // Banner height - responsive
  const bannerHeight = isMobile ? 160 : 200

  return (
    <Card elevate bordered overflow="hidden" p={0}>
      {/* Banner Section */}
      <YStack position="relative" height={bannerHeight} bg="$color4">
        {bannerUrl ? (
          <Image
            source={{ uri: bannerUrl }}
            width="100%"
            height={bannerHeight}
            objectFit="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ) : (
          <YStack
            bg="$blue5"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}

        {/* Avatar Overlay */}
        <YStack
          position="absolute"
          style={{
            bottom: -60,
            left: isMobile ? 16 : 24,
            zIndex: 10,
          }}
        >
          <Avatar circular size={isMobile ? 120 : 160} borderWidth={4} borderColor="$background">
            {avatarUrl ? (
              <Avatar.Image source={{ uri: avatarUrl }} />
            ) : (
              <Avatar.Fallback bg="$blue4">
                <Text fontSize="$10" fontWeight="700" color="$blue10">
                  {profile.name?.charAt(0) || '?'}
                </Text>
              </Avatar.Fallback>
            )}
          </Avatar>
        </YStack>
      </YStack>

      {/* Content Section */}
      <YStack gap="$4" p="$5" pt={isMobile ? 80 : 96}>
        {/* Header Row - Name, Headline, and Actions */}
        <XStack gap="$4" items="flex-start" justify="space-between" flexWrap="wrap">
          <YStack flex={1} gap="$2" minW={200}>
            {/* Name */}
            <Text fontSize={isMobile ? '$8' : '$10'} fontWeight="700" color="$color12">
              {profile.name || 'User'}
            </Text>

            {/* Headline */}
            {profile.headline && (
              <Text fontSize={isMobile ? '$5' : '$6'} color="$color11">
                {profile.headline}
              </Text>
            )}

            {/* Industry and Location */}
            <XStack gap="$3" flexWrap="wrap" items="center">
              {profile.industry_name && (
                <XStack gap="$2" items="center">
                  <Briefcase size={16} color="$color10" />
                  <Text fontSize="$3" color="$color11">
                    {profile.industry_name}
                  </Text>
                </XStack>
              )}
              {profile.location && (
                <XStack gap="$2" items="center">
                  <MapPin size={16} color="$color10" />
                  <Text fontSize="$3" color="$color11">
                    {profile.location}
                  </Text>
                </XStack>
              )}
            </XStack>
          </YStack>

          {/* Action Buttons */}
          <XStack gap="$2" flexWrap="wrap">
            {isOwnProfile && onEdit && (
              <Button size={isMobile ? '$3' : '$4'} theme="info" icon={Edit3} onPress={onEdit}>
                Edit Profile
              </Button>
            )}
            {!isOwnProfile && (
              <Button size={isMobile ? '$3' : '$4'} variant="outlined" icon={Share2}>
                Share
              </Button>
            )}
            {canLeaveReview && onLeaveReview && (
              <Button size={isMobile ? '$3' : '$4'} theme="info" icon={MessageSquare} onPress={onLeaveReview}>
                Leave Review
              </Button>
            )}
            <Button size={isMobile ? '$3' : '$4'} variant="outlined" circular icon={MoreVertical} />
          </XStack>
        </XStack>

        {/* Stats Row */}
        <XStack gap="$3" flexWrap="wrap" pt="$2" borderTopWidth={1} borderTopColor="$borderColor">
          {/* Scaffald Score */}
          {profile.gamified_score !== null && (
            <XStack
              bg="$blue2"
              px="$4"
              py="$2"
              rounded="$4"
              gap="$2"
              items="center"
              borderWidth={1}
              borderColor="$blue6"
            >
              <Star size={24} color="$blue10" fill="$blue10" />
              <YStack>
                <Text fontSize="$7" fontWeight="700" color="$blue11">
                  {profile.gamified_score}
                </Text>
                <Text fontSize="$2" color="$blue10">
                  Scaffald Score
                </Text>
              </YStack>
            </XStack>
          )}

          {/* Years of Experience */}
          {profile.years_of_experience !== null && (
            <XStack gap="$2" items="center" px="$3" py="$2" bg="$color2" rounded="$3">
              <Award size={18} color="$color11" />
              <Text fontSize="$3" color="$color11" fontWeight="600">
                {profile.years_of_experience} years experience
              </Text>
            </XStack>
          )}

          {/* Hourly Rate */}
          {profile.hourly_rate_cents && (
            <XStack gap="$2" items="center" px="$3" py="$2" bg="$color2" rounded="$3">
              <DollarSign size={18} color="$color11" />
              <Text fontSize="$3" color="$color11" fontWeight="600">
                {formatHourlyRate(profile.hourly_rate_cents)}
              </Text>
            </XStack>
          )}

          {/* Open to Work Badge */}
          {profile.open_to_work && (
            <XStack px="$3" py="$2" bg="$green3" rounded="$3" borderWidth={1} borderColor="$green7">
              <Text fontSize="$3" fontWeight="600" color="$green11">
                ✓ Available for Work
              </Text>
            </XStack>
          )}
        </XStack>
      </YStack>
    </Card>
  )
}

