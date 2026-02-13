import { useConnectionStatus } from '@scf/core/features/user-profile/hooks/useConnectionStatus'
import { useFollowStatus } from '@scf/core/features/user-profile/hooks/useFollowStatus'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import {
  useSendConnectionMutation,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
  useRemoveConnectionMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
} from '@scf/core/utils/engagement-sdk-hooks'
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
} from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Avatar,
  Button,
  Card,
  Image,
  Text,
  useWindowDimensions,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

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
  const toast = useToast()
  const queryClient = useQueryClient()

  // Connection and follow status hooks (only for other users' profiles)
  const connectionStatus = useConnectionStatus(isOwnProfile ? null : profile.id)
  const followStatus = useFollowStatus(isOwnProfile ? null : profile.id)

  // Connection mutations
  const sendRequestMutation = useSendConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'list'] })
      await queryClient.cancelQueries({ queryKey: ['connections', 'pending'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
      toast.show({
        title: 'Connection request sent',
        message: 'Your connection request has been sent.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Unable to send request',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
  })

  const acceptRequestMutation = useAcceptConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'list'] })
      await queryClient.cancelQueries({ queryKey: ['connections', 'pending'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
      toast.show({
        title: 'Connection accepted',
        message: 'You are now connected.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Unable to accept request',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
  })

  const declineRequestMutation = useDeclineConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'pending'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'pending'] })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Unable to decline request',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
  })

  const removeConnectionMutation = useRemoveConnectionMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connections', 'list'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections', 'list'] })
      toast.show({
        title: 'Connection removed',
        message: 'Connection has been removed.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Unable to remove connection',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
  })

  // Follow mutations
  const followMutation = useFollowUserMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['follows', 'following'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows', 'following'] })
      toast.show({
        title: 'Following',
        message: 'You are now following this user.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Unable to follow',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
  })

  const unfollowMutation = useUnfollowUserMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['follows', 'following'] })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows', 'following'] })
      toast.show({
        title: 'Unfollowed',
        message: 'You are no longer following this user.',
      })
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Unable to unfollow',
        message: error.message ?? 'Please try again in a moment.',
        variant: 'error',
      })
    },
  })

  // Connection button handlers
  const handleConnect = () => {
    sendRequestMutation.mutate({ targetUserId: profile.id })
  }

  const handleAccept = () => {
    if (connectionStatus.connectionId) {
      acceptRequestMutation.mutate(connectionStatus.connectionId)
    }
  }

  const handleDecline = () => {
    if (connectionStatus.connectionId) {
      declineRequestMutation.mutate(connectionStatus.connectionId)
    }
  }

  const handleRemoveConnection = () => {
    if (connectionStatus.connectionId) {
      removeConnectionMutation.mutate(connectionStatus.connectionId)
    }
  }

  // Follow button handlers
  const handleFollow = () => {
    followMutation.mutate({ targetUserId: profile.id })
  }

  const handleUnfollow = () => {
    unfollowMutation.mutate(profile.id)
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
      <Stack position="relative" height={bannerHeight} backgroundColor="$color4">
        {bannerUrl ? (
          <Image
            source={{ uri: bannerUrl }}
            width="100%"
            height={bannerHeight}
            objectFit="cover"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ) : (
          <Stack
            backgroundColor="$blue5"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}

        {/* Avatar Overlay */}
        <Stack
          position="absolute"
          style={{
            bottom: -60,
            left: isMobile ? 16 : 24,
            zIndex: 10,
          }}
        >
          <Avatar  size={isMobile ? 120 : 160} borderWidth={4} borderColor="$background">
            {avatarUrl ? (
              <Avatar.Image source={{ uri: avatarUrl }} />
            ) : (
              <Avatar.Fallback backgroundColor="$blue4">
                <Text color="$blue10">{profile.name?.charAt(0) || '?'}</Text>
              </Avatar.Fallback>
            )}
          </Avatar>
        </Stack>
      </Stack>

      {/* Content Section */}
      <Stack gap={16} padding="lg" paddingTop={isMobile ? 80 : 96}>
        {/* Header Row - Name, Headline, and Actions */}
        <Row gap={16} align="flex-start" justify="space-between" flexWrap="wrap">
          <Stack flex={1} gap={8} minWidth={200}>
            {/* Name */}
            <Text color="$gray11">{profile.name || 'User'}</Text>

            {/* Headline */}
            {profile.headline && <Text color="$gray11">{profile.headline}</Text>}

            {/* Industry and Location */}
            <Row gap={12} flexWrap="wrap" align="center">
              {profile.industry_name && (
                <Row gap={8} align="center">
                  <Briefcase size="md" color="$gray11" />
                  <Text color="$gray11">{profile.industry_name}</Text>
                </Row>
              )}
              {profile.location && (
                <Row gap={8} align="center">
                  <MapPin size="md" color="$gray11" />
                  <Text color="$gray11">{profile.location}</Text>
                </Row>
              )}
            </Row>
          </Stack>

          {/* Action Buttons */}
          <Row gap={8} flexWrap="wrap" align="center">
            {isOwnProfile && onEdit && (
              <Button size={isMobile ? '$3' : '$4'} theme="info" iconStart={Edit3} onPress={onEdit}>
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
                    iconStart={isConnectionMutating ? Loader2 : UserPlus}
                    onPress={handleConnect}
                    disabled={isConnectionMutating}
                  >
                    {isConnectionMutating ? 'Sending...' : 'Connect'}
                  </Button>
                )}

                {connectionButtonState.type === 'pending_sent' && (
                  <Button size={isMobile ? '$3' : '$4'} variant="outline" iconStart={Loader2} disabled>
                    Pending
                  </Button>
                )}

                {connectionButtonState.type === 'pending_received' && (
                  <>
                    <Button
                      size={isMobile ? '$3' : '$4'}
                      theme="info"
                      iconStart={CheckCircle2}
                      onPress={handleAccept}
                      disabled={isConnectionMutating}
                    >
                      {isConnectionMutating ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      size={isMobile ? '$3' : '$4'}
                      variant="outline"
                      iconStart={X}
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
                    variant="outline"
                    iconStart={UserCheck}
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
                  variant="outline"
                  iconStart={isFollowMutating ? Loader2 : UserPlus}
                  onPress={handleFollow}
                  disabled={isFollowMutating}
                >
                  {isFollowMutating ? 'Following...' : 'Follow'}
                </Button>
              ) : (
                <Button
                  size={isMobile ? '$3' : '$4'}
                  variant="outline"
                  iconStart={isFollowMutating ? Loader2 : UserMinus}
                  onPress={handleUnfollow}
                  disabled={isFollowMutating}
                >
                  {isFollowMutating ? 'Unfollowing...' : 'Following'}
                </Button>
              ))}

            {!isOwnProfile && (
              <Button size={isMobile ? '$3' : '$4'} variant="outline" iconStart={Share2}>
                Share
              </Button>
            )}
            {canLeaveReview && onLeaveReview && (
              <Button
                size={isMobile ? '$3' : '$4'}
                theme="info"
                iconStart={MessageSquare}
                onPress={onLeaveReview}
              >
                Leave Review
              </Button>
            )}
            <Button size={isMobile ? '$3' : '$4'} variant="outline"  iconStart={MoreVertical} />
          </Row>
        </Row>

        {/* Stats Row */}
        <Row
          gap={12}
          flexWrap="wrap"
          paddingTop={8}
          borderTopWidth={1}
          borderTopColor="$borderColor"
        >
          {/* Scaffald Score */}
          {profile.gamified_score !== null && (
            <Row
              backgroundColor="$blue2"
              paddingHorizontal={16}
              paddingVertical={8}
              borderRadius={16}
              gap={8}
              align="center"
              borderWidth={1}
              borderColor="$blue6"
            >
              <Star size={24} color="$blue10" fill="$blue10" />
              <Stack>
                <Text color="$blue11">{profile.gamified_score}</Text>
                <Text color="$blue10">Scaffald Score</Text>
              </Stack>
            </Row>
          )}

          {/* Years of Experience */}
          {formattedYears !== null && (
            <Row
              gap={8}
              align="center"
              paddingHorizontal={12}
              paddingVertical={8}
              backgroundColor="$color2"
              borderRadius={12}
            >
              <Award size={18} color="$gray11" />
              <Text color="$gray11">{formattedYears} years experience</Text>
            </Row>
          )}

          {/* Hourly Rate */}
          {profile.hourly_rate_cents && (
            <Row
              gap={8}
              align="center"
              paddingHorizontal={12}
              paddingVertical={8}
              backgroundColor="$color2"
              borderRadius={12}
            >
              <DollarSign size={18} color="$gray11" />
              <Text color="$gray11">{formatHourlyRate(profile.hourly_rate_cents)}</Text>
            </Row>
          )}

          {/* Open to Work Badge */}
          {profile.open_to_work && (
            <Row
              paddingHorizontal={12}
              paddingVertical={8}
              backgroundColor="$green3"
              borderRadius={12}
              borderWidth={1}
              borderColor="$green7"
            >
              <Text color="$green11">✓ Available for Work</Text>
            </Row>
          )}
        </Row>
      </Stack>
    </Card>
  )
}
