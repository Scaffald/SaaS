import { useConnectionStatus } from '@scf/core/features/user-profile/hooks/useConnectionStatus'
import { useFollowStatus } from '@scf/core/features/user-profile/hooks/useFollowStatus'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import { api } from '@scf/core/utils/api'
import {
  Award,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Edit3,
  Loader2,
  MapPin,
  MessageSquare,
  MoreVertical,
  Share2,
  Star,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useMemo } from 'react'
import {
  Avatar,
  Button,
  Card,
  Image,
  Text,
  useWindowDimensions,
  XStack,
  YStack,
} from '@unicornlove/ui'

interface UserProfileHeaderEnhancedProps {
  profile: {
    id: string
    name: string | null
    avatar_url: string | null
    avatar_path: string | null
    headline: string | null
    industry_name: string | null
    years_of_experience: number | null
    calculatedYearsOfExperience?: number | null
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
  const toast = useToastController()
  const utils = api.useUtils()

  // Connection and follow status hooks (only for other users' profiles)
  const connectionStatus = useConnectionStatus(isOwnProfile ? null : profile.id)
  const followStatus = useFollowStatus(isOwnProfile ? null : profile.id)

  // Connection mutations
  const sendRequestMutation = api.connections.sendRequest.useMutation({
    onMutate: async () => {
      await utils.connections.getConnections.cancel()
      await utils.connections.getPendingRequests.cancel()
    },
    onSuccess: () => {
      utils.connections.getConnections.invalidate()
      utils.connections.getPendingRequests.invalidate()
      toast.show('Connection request sent', {
        message: 'Your connection request has been sent.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to send request', {
        message: error.message ?? 'Please try again in a moment.',
      })
    },
  })

  const acceptRequestMutation = api.connections.acceptRequest.useMutation({
    onMutate: async () => {
      await utils.connections.getConnections.cancel()
      await utils.connections.getPendingRequests.cancel()
    },
    onSuccess: () => {
      utils.connections.getConnections.invalidate()
      utils.connections.getPendingRequests.invalidate()
      toast.show('Connection accepted', {
        message: 'You are now connected.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to accept request', {
        message: error.message ?? 'Please try again in a moment.',
      })
    },
  })

  const declineRequestMutation = api.connections.declineRequest.useMutation({
    onMutate: async () => {
      await utils.connections.getPendingRequests.cancel()
    },
    onSuccess: () => {
      utils.connections.getPendingRequests.invalidate()
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to decline request', {
        message: error.message ?? 'Please try again in a moment.',
      })
    },
  })

  const removeConnectionMutation = api.connections.removeConnection.useMutation({
    onMutate: async () => {
      await utils.connections.getConnections.cancel()
    },
    onSuccess: () => {
      utils.connections.getConnections.invalidate()
      toast.show('Connection removed', {
        message: 'Connection has been removed.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to remove connection', {
        message: error.message ?? 'Please try again in a moment.',
      })
    },
  })

  // Follow mutations
  const followMutation = api.follows.followUser.useMutation({
    onMutate: async () => {
      await utils.follows.getFollowing.cancel()
    },
    onSuccess: () => {
      utils.follows.getFollowing.invalidate()
      toast.show('Following', {
        message: 'You are now following this user.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to follow', {
        message: error.message ?? 'Please try again in a moment.',
      })
    },
  })

  const unfollowMutation = api.follows.unfollowUser.useMutation({
    onMutate: async () => {
      await utils.follows.getFollowing.cancel()
    },
    onSuccess: () => {
      utils.follows.getFollowing.invalidate()
      toast.show('Unfollowed', {
        message: 'You are no longer following this user.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show('Unable to unfollow', {
        message: error.message ?? 'Please try again in a moment.',
      })
    },
  })

  // Connection button handlers
  const handleConnect = () => {
    sendRequestMutation.mutate({ targetUserId: profile.id })
  }

  const handleAccept = () => {
    if (connectionStatus.connectionId) {
      acceptRequestMutation.mutate({ connectionId: connectionStatus.connectionId })
    }
  }

  const handleDecline = () => {
    if (connectionStatus.connectionId) {
      declineRequestMutation.mutate({ connectionId: connectionStatus.connectionId })
    }
  }

  const handleRemoveConnection = () => {
    if (connectionStatus.connectionId) {
      removeConnectionMutation.mutate({ connectionId: connectionStatus.connectionId })
    }
  }

  // Follow button handlers
  const handleFollow = () => {
    followMutation.mutate({ targetUserId: profile.id })
  }

  const handleUnfollow = () => {
    unfollowMutation.mutate({ targetUserId: profile.id })
  }

  // Determine connection button state
  const connectionButtonState = useMemo(() => {
    if (isOwnProfile || connectionStatus.isLoading) {
      return null
    }

    if (connectionStatus.isConnected) {
      return { type: 'connected' as const, connectionId: connectionStatus.connectionId }
    }

    if (connectionStatus.isPending) {
      if (connectionStatus.isSent) {
        return { type: 'pending_sent' as const, connectionId: connectionStatus.connectionId }
      }
      if (connectionStatus.isReceived) {
        return { type: 'pending_received' as const, connectionId: connectionStatus.connectionId }
      }
    }

    return { type: 'none' as const }
  }, [isOwnProfile, connectionStatus])

  const isConnectionMutating =
    sendRequestMutation.isPending ||
    acceptRequestMutation.isPending ||
    declineRequestMutation.isPending ||
    removeConnectionMutation.isPending

  const isFollowMutating = followMutation.isPending || unfollowMutation.isPending

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
    <Card elevate bordered overflow="hidden" padding={0}>
      {/* Banner Section */}
      <YStack position="relative" height={bannerHeight} backgroundColor="$color4">
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
            backgroundColor="$blue5"
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
              <Avatar.Fallback backgroundColor="$blue4">
                <Text fontSize="$10" fontWeight="700" color="$blue10">
                  {profile.name?.charAt(0) || '?'}
                </Text>
              </Avatar.Fallback>
            )}
          </Avatar>
        </YStack>
      </YStack>

      {/* Content Section */}
      <YStack gap="$4" padding="$5" paddingTop={isMobile ? 80 : 96}>
        {/* Header Row - Name, Headline, and Actions */}
        <XStack gap="$4" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap">
          <YStack flex={1} gap="$2" minWidth={200}>
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
            <XStack gap="$3" flexWrap="wrap" alignItems="center">
              {profile.industry_name && (
                <XStack gap="$2" alignItems="center">
                  <Briefcase size={16} color="$color10" />
                  <Text fontSize="$3" color="$color11">
                    {profile.industry_name}
                  </Text>
                </XStack>
              )}
              {profile.location && (
                <XStack gap="$2" alignItems="center">
                  <MapPin size={16} color="$color10" />
                  <Text fontSize="$3" color="$color11">
                    {profile.location}
                  </Text>
                </XStack>
              )}
            </XStack>
          </YStack>

          {/* Action Buttons */}
          <XStack gap="$2" flexWrap="wrap" alignItems="center">
            {isOwnProfile && onEdit && (
              <Button size={isMobile ? '$3' : '$4'} theme="info" icon={Edit3} onPress={onEdit}>
                Edit Profile
              </Button>
            )}

            {/* Connect Button (only for other users' profiles) */}
            {!isOwnProfile && connectionButtonState && (
              <>
                {connectionButtonState.type === 'none' && (
                  <Button
                    size={isMobile ? '$3' : '$4'}
                    theme="info"
                    icon={isConnectionMutating ? Loader2 : UserPlus}
                    onPress={handleConnect}
                    disabled={isConnectionMutating}
                  >
                    {isConnectionMutating ? 'Sending...' : 'Connect'}
                  </Button>
                )}

                {connectionButtonState.type === 'pending_sent' && (
                  <Button size={isMobile ? '$3' : '$4'} variant="outlined" icon={Loader2} disabled>
                    Pending
                  </Button>
                )}

                {connectionButtonState.type === 'pending_received' && (
                  <>
                    <Button
                      size={isMobile ? '$3' : '$4'}
                      theme="info"
                      icon={CheckCircle2}
                      onPress={handleAccept}
                      disabled={isConnectionMutating}
                    >
                      {isConnectionMutating ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      size={isMobile ? '$3' : '$4'}
                      variant="outlined"
                      icon={X}
                      onPress={handleDecline}
                      disabled={isConnectionMutating}
                    >
                      Decline
                    </Button>
                  </>
                )}

                {connectionButtonState.type === 'connected' && (
                  <Button
                    size={isMobile ? '$3' : '$4'}
                    variant="outlined"
                    icon={UserCheck}
                    onPress={handleRemoveConnection}
                    disabled={isConnectionMutating}
                  >
                    {isConnectionMutating ? 'Removing...' : 'Connected'}
                  </Button>
                )}
              </>
            )}

            {/* Follow Button (only for other users' profiles) */}
            {!isOwnProfile &&
              !followStatus.isLoading &&
              (!followStatus.isFollowing ? (
                <Button
                  size={isMobile ? '$3' : '$4'}
                  variant="outlined"
                  icon={isFollowMutating ? Loader2 : UserPlus}
                  onPress={handleFollow}
                  disabled={isFollowMutating}
                >
                  {isFollowMutating ? 'Following...' : 'Follow'}
                </Button>
              ) : (
                <Button
                  size={isMobile ? '$3' : '$4'}
                  variant="outlined"
                  icon={isFollowMutating ? Loader2 : UserMinus}
                  onPress={handleUnfollow}
                  disabled={isFollowMutating}
                >
                  {isFollowMutating ? 'Unfollowing...' : 'Following'}
                </Button>
              ))}

            {!isOwnProfile && (
              <Button size={isMobile ? '$3' : '$4'} variant="outlined" icon={Share2}>
                Share
              </Button>
            )}
            {canLeaveReview && onLeaveReview && (
              <Button
                size={isMobile ? '$3' : '$4'}
                theme="info"
                icon={MessageSquare}
                onPress={onLeaveReview}
              >
                Leave Review
              </Button>
            )}
            <Button size={isMobile ? '$3' : '$4'} variant="outlined" circular icon={MoreVertical} />
          </XStack>
        </XStack>

        {/* Stats Row */}
        <XStack
          gap="$3"
          flexWrap="wrap"
          paddingTop="$2"
          borderTopWidth={1}
          borderTopColor="$borderColor"
        >
          {/* Scaffald Score */}
          {profile.gamified_score !== null && (
            <XStack
              backgroundColor="$blue2"
              paddingHorizontal="$4"
              paddingVertical="$2"
              borderRadius="$4"
              gap="$2"
              alignItems="center"
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
          {formattedYears !== null && (
            <XStack
              gap="$2"
              alignItems="center"
              paddingHorizontal="$3"
              paddingVertical="$2"
              backgroundColor="$color2"
              borderRadius="$3"
            >
              <Award size={18} color="$color11" />
              <Text fontSize="$3" color="$color11" fontWeight="600">
                {formattedYears} years experience
              </Text>
            </XStack>
          )}

          {/* Hourly Rate */}
          {profile.hourly_rate_cents && (
            <XStack
              gap="$2"
              alignItems="center"
              paddingHorizontal="$3"
              paddingVertical="$2"
              backgroundColor="$color2"
              borderRadius="$3"
            >
              <DollarSign size={18} color="$color11" />
              <Text fontSize="$3" color="$color11" fontWeight="600">
                {formatHourlyRate(profile.hourly_rate_cents)}
              </Text>
            </XStack>
          )}

          {/* Open to Work Badge */}
          {profile.open_to_work && (
            <XStack
              paddingHorizontal="$3"
              paddingVertical="$2"
              backgroundColor="$green3"
              borderRadius="$3"
              borderWidth={1}
              borderColor="$green7"
            >
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
