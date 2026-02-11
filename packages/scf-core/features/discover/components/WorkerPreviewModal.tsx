import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { formatDateRange } from '@scf/core/features/profile/utils/date-formatting'
import { useConnectionStatus } from '@scf/core/features/user-profile/hooks/useConnectionStatus'
import { useFollowStatus } from '@scf/core/features/user-profile/hooks/useFollowStatus'
import { useAuth } from '@scf/core/provider/auth/useAuth'
import {
  useSendConnectionMutation,
  useAcceptConnectionMutation,
  useDeclineConnectionMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
} from '@scf/core/utils/engagement-sdk-hooks'
import {
  useUserProfile,
  useUserSkills,
  useUserCertifications,
  useUserExperience,
  useUserEducation,
} from '@scf/core/utils/user-profiles-sdk-hooks'
import { useAdaptiveLoading } from '@scf/core/utils/useAdaptiveLoading'
import { useQueryClient } from '@tanstack/react-query'
import { ResponsiveModal } from '@unicornlove/beyond-ui'
import {
  Award,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  GraduationCap,
  Loader2,
  MapPin,
  Star,
  User,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Button, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

interface WorkerPreviewModalProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Enriched skill from API response
 * Based on EnrichedUserSkill from skill-enrichment
 */
type EnrichedSkill = {
  id: string
  name: string
  label: string
  displayCode?: string | null
  proficiency: number
  [key: string]: unknown
}

/**
 * Certification from API response
 */
type Certification = {
  id: string
  name: string
  issuing_organization?: string | null
  issue_date?: string | null
  [key: string]: unknown
}

/**
 * Experience entry from API response
 */
type ExperienceEntry = {
  id: string
  job_title: string
  company_name: string
  start_date?: string | null
  end_date?: string | null
  is_current?: boolean | null
  [key: string]: unknown
}

/**
 * Education entry from API response
 */
type EducationEntry = {
  id: string
  degree_type?: string | null
  degree_name?: string | null
  institution_name?: string | null
  [key: string]: unknown
}

/**
 * Worker Preview Modal
 * Shows a quick preview of a worker's profile with option to view full profile
 */
export function WorkerPreviewModal({ userId, open, onOpenChange }: WorkerPreviewModalProps) {
  const router = useRouter()
  const toast = useToast()
  const { session } = useAuth()
  const currentUserId = session?.user?.id
  const queryClient = useQueryClient()

  // Check if viewing own profile
  const isOwnProfile = currentUserId === userId

  // Connection and follow status hooks (only for other users' profiles)
  const connectionStatus = useConnectionStatus(isOwnProfile || !open ? null : userId)
  const followStatus = useFollowStatus(isOwnProfile || !open ? null : userId)

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
    if (userId) {
      sendRequestMutation.mutate({ targetUserId: userId })
    }
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

  // Follow button handlers
  const handleFollow = () => {
    if (userId) {
      followMutation.mutate({ targetUserId: userId })
    }
  }

  const handleUnfollow = () => {
    if (userId) {
      unfollowMutation.mutate(userId)
    }
  }

  // Determine connection button state
  const connectionButtonState = useMemo(() => {
    if (isOwnProfile || !open || connectionStatus.isLoading) {
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
  }, [isOwnProfile, open, connectionStatus])

  const isConnectionMutating =
    sendRequestMutation.isPending ||
    acceptRequestMutation.isPending ||
    declineRequestMutation.isPending

  const isFollowMutating = followMutation.isPending || unfollowMutation.isPending

  // Fetch worker profile data
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId, {
    enabled: open,
  })

  // Fetch top skills
  const { data: skills = [], isLoading: skillsLoading } = useUserSkills(userId, {
    enabled: open,
  })

  // Fetch certifications
  const { data: certifications = [], isLoading: certsLoading } = useUserCertifications(userId, {
    enabled: open,
  })

  // Fetch work experience
  const { data: experience = [], isLoading: experienceLoading } = useUserExperience(userId, {
    enabled: open,
  })

  // Fetch education
  const { data: education = [], isLoading: educationLoading } = useUserEducation(userId, {
    enabled: open,
  })

  const isLoading =
    profileLoading || skillsLoading || certsLoading || experienceLoading || educationLoading
  const showLoading = useAdaptiveLoading(isLoading, 300)

  const handleViewFullProfile = () => {
    if (!userId) return

    try {
      router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.WORKERS.DETAIL, { id: userId }))
      onOpenChange(false)
    } catch (navigationError) {
      console.error('Failed to navigate to worker profile', navigationError)
      toast.show({
          title: 'Unable to load profile',
          message: 'Please try again.',
          variant: 'error',
        })
    }
  }

  const handleOpenInNewTab = () => {
    if (!userId) return
    if (typeof window !== 'undefined') {
      window.open(buildPath(ROUTES.DASHBOARD.USER, { userId }), '_blank')
    }
  }

  const formatHourlyRate = (cents: number | null) => {
    if (!cents) return null
    const dollars = cents / 100
    return `$${dollars.toFixed(2)}/hr`
  }

  const resolveYearsOfExperience = (years: number | null | undefined) => {
    if (typeof years !== 'number' || Number.isNaN(years)) {
      return null
    }
    return years % 1 !== 0 ? years.toFixed(1) : years
  }

  const topSkills = skills.slice(0, 10)
  const topCertifications = certifications.slice(0, 5)
  const recentExperience = experience.slice(0, 3)
  const topEducation = education.slice(0, 1)

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={profile?.name || 'Worker Profile'}
      size="medium"
    >
      {showLoading ? (
        <Stack paddingVertical="$8" alignItems="center" justifyContent="center">
          <Spinner size="large" color="$blue10" />
          <Text marginTop="$4" color="$color11">
            Loading profile...
          </Text>
        </Stack>
      ) : isLoading ? null : !profile ? (
        <Stack paddingVertical="$8" alignItems="center">
          <Text color="$red10" fontSize="$5" fontWeight="600">
            Profile not found
          </Text>
        </Stack>
      ) : (
        <>
          {/* Profile Header */}
          <Stack gap="$2" alignItems="center">
            {profile.avatar_url ? (
              <Stack
                width={96}
                height={96}
                borderRadius="$10"
                overflow="hidden"
                backgroundColor="$color3"
              >
                <img
                  src={profile.avatar_url}
                  alt={profile.name || 'Worker'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Stack>
            ) : (
              <Stack
                width={96}
                height={96}
                borderRadius="$10"
                backgroundColor="$blue4"
                alignItems="center"
                justifyContent="center"
              >
                <User size={48} color="$blue10" />
              </Stack>
            )}

            <Stack gap="$2" alignItems="center">
              <Text fontSize="$8" fontWeight="700" color="$color12">
                {profile.name}
              </Text>
              {profile.headline && (
                <Text fontSize="$5" color="$color11">
                  {profile.headline}
                </Text>
              )}
            </Stack>

            {/* Scaffald Score Badge */}
            {profile.gamified_score !== null && (
              <Row
                backgroundColor="$blue2"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderRadius="$10"
                gap="$2"
                alignItems="center"
                borderWidth={1}
                borderColor="$blue5"
              >
                <Star size={20} color="$blue10" fill="$blue10" />
                <Text fontSize="$6" fontWeight="700" color="$blue11">
                  {profile.gamified_score}
                </Text>
                <Text fontSize="$3" color="$blue10">
                  Scaffald Score
                </Text>
              </Row>
            )}
          </Stack>

          <Separator />

          {/* Quick Info */}
          <Stack gap="$2">
            {profile.location && (
              <Row gap="$2" alignItems="center">
                <MapPin size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {profile.location}
                </Text>
              </Row>
            )}

            {profile.hourly_rate_cents && (
              <Row gap="$2" alignItems="center">
                <DollarSign size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {formatHourlyRate(profile.hourly_rate_cents)}
                </Text>
              </Row>
            )}

            {resolveYearsOfExperience(
              typeof profile?.calculatedYearsOfExperience === 'number'
                ? profile.calculatedYearsOfExperience
                : (profile.years_of_experience ?? null)
            ) !== null && (
              <Row gap="$2" alignItems="center">
                <Award size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {resolveYearsOfExperience(
                    typeof profile?.calculatedYearsOfExperience === 'number'
                      ? profile.calculatedYearsOfExperience
                      : (profile.years_of_experience ?? null)
                  )}{' '}
                  years experience
                </Text>
              </Row>
            )}

            {profile.open_to_work && (
              <Row
                backgroundColor="$green3"
                paddingHorizontal="$3"
                paddingVertical="$1.5"
                borderRadius="$3"
              >
                <Text fontSize="$3" fontWeight="600" color="$green11">
                  Available for Work
                </Text>
              </Row>
            )}
          </Stack>

          {/* Bio */}
          {profile.bio && (
            <>
              <Separator />
              <Stack gap="$2">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  About
                </Text>
                <Text fontSize="$4" color="$color11" lineHeight="$1" numberOfLines={4}>
                  {profile.bio}
                </Text>
              </Stack>
            </>
          )}

          {/* Top Skills */}
          {topSkills.length > 0 && (
            <>
              <Separator />
              <Stack gap="$2">
                <Row alignItems="center" gap="$2" justifyContent="space-between">
                  <Row alignItems="center" gap="$2">
                    <Award size={18} color="$color12" />
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Top Skills
                    </Text>
                  </Row>
                  {skills.length > 10 && (
                    <Button size="$2" variant="outlined" onPress={handleViewFullProfile}>
                      View All ({skills.length})
                    </Button>
                  )}
                </Row>
                <Stack gap="$2">
                  {topSkills.map((skill: EnrichedSkill) => {
                    const label =
                      typeof skill.label === 'string'
                        ? skill.label
                        : skill.displayCode
                          ? `${skill.displayCode} · ${skill.name}`
                          : skill.name
                    return (
                      <Row key={skill.id} justifyContent="space-between" alignItems="center">
                        <Text fontSize="$4" color="$color11">
                          {label}
                        </Text>
                        <Row gap="$2" alignItems="center">
                          <Stack
                            width={100}
                            height={8}
                            backgroundColor="$color4"
                            borderRadius="$2"
                            overflow="hidden"
                          >
                            <Stack
                              width={`${skill.proficiency}%`}
                              height="100%"
                              backgroundColor="$blue10"
                            />
                          </Stack>
                          <Stack minWidth={30}>
                            <Text fontSize="$3" color="$color10">
                              {skill.proficiency}%
                            </Text>
                          </Stack>
                        </Row>
                      </Row>
                    )
                  })}
                </Stack>
              </Stack>
            </>
          )}

          {/* Certifications */}
          {topCertifications.length > 0 && (
            <>
              <Separator />
              <Stack gap="$2">
                <Row alignItems="center" gap="$2" justifyContent="space-between">
                  <Row alignItems="center" gap="$2">
                    <BadgeCheck size={18} color="$color12" />
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Certifications
                    </Text>
                  </Row>
                  {certifications.length > 5 && (
                    <Button size="$2" variant="outlined" onPress={handleViewFullProfile}>
                      View All ({certifications.length})
                    </Button>
                  )}
                </Row>
                <Stack gap="$2">
                  {topCertifications.map((cert: Certification) => (
                    <Stack key={cert.id} gap="$1">
                      <Text fontSize="$4" fontWeight="600" color="$color12">
                        {cert.name}
                      </Text>
                      <Text fontSize="$3" color="$color10">
                        {cert.issuing_organization}
                        {cert.issue_date &&
                          ` • ${new Date(cert.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </>
          )}

          {/* Work Experience */}
          {recentExperience.length > 0 && (
            <>
              <Separator />
              <Stack gap="$2">
                <Row alignItems="center" gap="$2" justifyContent="space-between">
                  <Row alignItems="center" gap="$2">
                    <Briefcase size={18} color="$color12" />
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Recent Experience
                    </Text>
                  </Row>
                  {experience.length > 3 && (
                    <Button size="$2" variant="outlined" onPress={handleViewFullProfile}>
                      View All ({experience.length})
                    </Button>
                  )}
                </Row>
                <Stack gap="$2">
                  {recentExperience.map((exp: ExperienceEntry) => (
                    <Stack key={exp.id} gap="$1">
                      <Text fontSize="$4" fontWeight="600" color="$color12">
                        {exp.job_title} at {exp.company_name}
                      </Text>
                      <Text fontSize="$3" color="$color10">
                        {formatDateRange(exp.start_date, exp.end_date, exp.is_current ?? false)}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </>
          )}

          {/* Education */}
          {topEducation.length > 0 && (
            <>
              <Separator />
              <Stack gap="$2">
                <Row alignItems="center" gap="$2">
                  <GraduationCap size={18} color="$color12" />
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Education
                  </Text>
                </Row>
                <Stack gap="$2">
                  {topEducation.map((edu: EducationEntry) => (
                    <Stack key={edu.id} gap="$1">
                      <Text fontSize="$4" fontWeight="600" color="$color12">
                        {edu.degree_type} {edu.degree_name}
                      </Text>
                      <Text fontSize="$3" color="$color10">
                        {edu.university_name}
                        {edu.graduation_year && ` • ${edu.graduation_year}`}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </>
          )}

          <Separator />

          {/* Connect and Follow Buttons (only for other users' profiles) */}
          {!isOwnProfile && userId && (
            <>
              <Row gap="$2" flexWrap="wrap" justifyContent="center">
                {/* Connect Button */}
                {connectionButtonState && (
                  <>
                    {connectionButtonState.type === 'none' && (
                      <Button
                        size="$4"
                        theme="info"
                        icon={isConnectionMutating ? Loader2 : UserPlus}
                        onPress={handleConnect}
                        disabled={isConnectionMutating}
                      >
                        {isConnectionMutating ? 'Sending...' : 'Connect'}
                      </Button>
                    )}

                    {connectionButtonState.type === 'pending_sent' && (
                      <Button size="$4" variant="outlined" icon={Loader2} disabled>
                        Pending
                      </Button>
                    )}

                    {connectionButtonState.type === 'pending_received' && (
                      <>
                        <Button
                          size="$4"
                          theme="info"
                          icon={CheckCircle2}
                          onPress={handleAccept}
                          disabled={isConnectionMutating}
                        >
                          {isConnectionMutating ? 'Accepting...' : 'Accept'}
                        </Button>
                        <Button
                          size="$4"
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
                      <Button size="$4" variant="outlined" icon={UserCheck} disabled>
                        Connected
                      </Button>
                    )}
                  </>
                )}

                {/* Follow Button */}
                {!followStatus.isLoading &&
                  (!followStatus.isFollowing ? (
                    <Button
                      size="$4"
                      variant="outlined"
                      icon={isFollowMutating ? Loader2 : UserPlus}
                      onPress={handleFollow}
                      disabled={isFollowMutating}
                    >
                      {isFollowMutating ? 'Following...' : 'Follow'}
                    </Button>
                  ) : (
                    <Button
                      size="$4"
                      variant="outlined"
                      icon={isFollowMutating ? Loader2 : UserMinus}
                      onPress={handleUnfollow}
                      disabled={isFollowMutating}
                    >
                      {isFollowMutating ? 'Unfollowing...' : 'Following'}
                    </Button>
                  ))}
              </Row>
              <Separator />
            </>
          )}

          {/* CTA Buttons */}
          <Stack gap="$3">
            {typeof window !== 'undefined' && (
              <Button
                size="$5"
                theme="blue"
                variant="outlined"
                iconAfter={<ExternalLink size={18} />}
                onPress={handleOpenInNewTab}
              >
                Open in New Tab
              </Button>
            )}
            <Button
              size="$5"
              theme="info"
              iconAfter={<ExternalLink size={18} />}
              onPress={handleViewFullProfile}
            >
              View Full Profile
            </Button>
          </Stack>
        </>
      )}
    </ResponsiveModal>
  )
}
