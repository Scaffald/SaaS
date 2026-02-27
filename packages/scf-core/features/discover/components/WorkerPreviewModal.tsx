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
import { ResponsiveModal } from '@scaffald/ui'
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
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Image as RNImage } from 'react-native'
import { Button, Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'

interface WorkerPreviewModalProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Enriched skill from API response
 * Based on EnrichedUserSkill from skill-enrichment
 */
// biome-ignore lint/correctness/noUnusedVariables: type documentation
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
// biome-ignore lint/correctness/noUnusedVariables: type documentation
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
// biome-ignore lint/correctness/noUnusedVariables: type documentation
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
// biome-ignore lint/correctness/noUnusedVariables: type documentation
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

  const uid = userId ?? undefined

  // Fetch worker profile data
  const { data: profile, isLoading: profileLoading } = useUserProfile(uid, {
    enabled: open,
  })

  // Fetch top skills
  const { data: skills = [], isLoading: skillsLoading } = useUserSkills(uid, {
    enabled: open,
  })

  // Fetch certifications
  const { data: certifications = [], isLoading: certsLoading } = useUserCertifications(uid, {
    enabled: open,
  })

  // Fetch work experience
  const { data: experience = [], isLoading: experienceLoading } = useUserExperience(uid, {
    enabled: open,
  })

  // Fetch education
  const { data: education = [], isLoading: educationLoading } = useUserEducation(uid, {
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
      size="md"
    >
      {showLoading ? (
        <Stack paddingVertical={32} align="center" justify="center">
          <Spinner size="lg" color="primary" />
          <Text style={{ marginTop: 16 }} color="secondary">
            Loading profile...
          </Text>
        </Stack>
      ) : isLoading ? null : !profile ? (
        <Stack paddingVertical={32} align="center">
          <Text color="error">Profile not found</Text>
        </Stack>
      ) : (
        <>
          {/* Profile Header */}
          <Stack gap={8} align="center">
            {profile.avatar_url ? (
              <Stack
                width={96}
                height={96}
                borderRadius={10}
                backgroundColor="$color3"
                style={{ overflow: 'hidden' }}
              >
                <RNImage
                  source={{ uri: profile.avatar_url }}
                  style={{ width: 96, height: 96 }}
                  resizeMode="cover"
                  accessibilityLabel={profile.name || 'Worker'}
                />
              </Stack>
            ) : (
              <Stack
                width={96}
                height={96}
                borderRadius={10}
                backgroundColor="$blue4"
                align="center"
                justify="center"
              >
                <User size={48} color="#0ea5e9" />
              </Stack>
            )}

            <Stack gap={8} align="center">
              <Text color="secondary">{profile.name}</Text>
              {profile.headline && <Text color="secondary">{profile.headline}</Text>}
            </Stack>

            {/* Scaffald Score Badge */}
            {profile.gamified_score !== null && (
              <Row
                paddingHorizontal={16}
                paddingVertical={8}
                borderRadius={10}
                gap={8}
                align="center"
                borderWidth={1}
                style={{ backgroundColor: 'var(--color-blue-2)', borderColor: 'var(--color-blue-5)' }}
              >
                <Star size={24} color="#0ea5e9" fill="#0ea5e9" />
                <Text style={{ color: 'var(--color-blue-11)' }}>{profile.gamified_score}</Text>
                <Text color="primary">Scaffald Score</Text>
              </Row>
            )}
          </Stack>

          <Separator />

          {/* Quick Info */}
          <Stack gap={8}>
            {profile.location && (
              <Row gap={8} align="center">
                <MapPin size={18} color="secondary" />
                <Text color="secondary">{profile.location}</Text>
              </Row>
            )}

            {profile.hourly_rate_cents && (
              <Row gap={8} align="center">
                <DollarSign size={18} color="secondary" />
                <Text color="secondary">{formatHourlyRate(profile.hourly_rate_cents)}</Text>
              </Row>
            )}

            {resolveYearsOfExperience(
              (profile as { calculatedYearsOfExperience?: number }).calculatedYearsOfExperience ??
                profile.years_of_experience ??
                null
            ) !== null && (
              <Row gap={8} align="center">
                <Award size={18} color="#737373" />
                <Text color="secondary">
                  {resolveYearsOfExperience(
                    (profile as { calculatedYearsOfExperience?: number }).calculatedYearsOfExperience ??
                      profile.years_of_experience ??
                      null
                  )}{' '}
                  years experience
                </Text>
              </Row>
            )}

            {profile.open_to_work && (
              <Row
                paddingHorizontal={12}
                paddingVertical={6}
                borderRadius={12}
                style={{ backgroundColor: 'var(--color-green-3)' }}
              >
                <Text style={{ color: 'var(--color-green-11)' }}>Available for Work</Text>
              </Row>
            )}
          </Stack>

          {/* Bio */}
          {profile.bio && (
            <>
              <Separator />
              <Stack gap={8}>
                <Text color="secondary">About</Text>
                <Text color="secondary" style={{ lineHeight: 24 }}>
                  {profile.bio}
                </Text>
              </Stack>
            </>
          )}

          {/* Top Skills */}
          {topSkills.length > 0 && (
            <>
              <Separator />
              <Stack gap={8}>
                <Row align="center" gap={8} justify="space-between">
                  <Row align="center" gap={8}>
                    <Award size={18} color="secondary" />
                    <Text color="secondary">Top Skills</Text>
                  </Row>
                  {skills.length > 10 && (
                    <Button size="sm" variant="outline" onPress={handleViewFullProfile}>
                      View All ({skills.length})
                    </Button>
                  )}
                </Row>
                <Stack gap={8}>
                  {topSkills.map((skill) => {
                    const label =
                      skill.skill_details?.name ??
                      skill.skill_taxonomy
                    const pct = skill.proficiency_level ?? 0
                    return (
                      <Row key={skill.id} justify="space-between" align="center">
                        <Text color="secondary">{label}</Text>
                        <Row gap={8} align="center">
                          <Stack
                            width={100}
                            height={8}
                            backgroundColor="$color4"
                            borderRadius={8}
                            style={{ overflow: 'hidden' }}
                          >
                            <Stack
                              flex={1}
                              align="flex-start"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: 'var(--color-blue-10)',
                                minHeight: 8,
                              }}
                            />
                          </Stack>
                          <Stack minWidth={30}>
                            <Text color="secondary">{pct}%</Text>
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
              <Stack gap={8}>
                <Row align="center" gap={8} justify="space-between">
                  <Row align="center" gap={8}>
                    <BadgeCheck size={18} color="secondary" />
                    <Text color="secondary">Certifications</Text>
                  </Row>
                  {certifications.length > 5 && (
                    <Button size="sm" variant="outline" onPress={handleViewFullProfile}>
                      View All ({certifications.length})
                    </Button>
                  )}
                </Row>
                <Stack gap={8}>
                  {topCertifications.map((cert) => (
                    <Stack key={cert.id} gap={4}>
                      <Text color="secondary">{cert.certification?.name ?? 'Certification'}</Text>
                      <Text color="secondary">
                        {cert.certification?.issuing_organization ?? ''}
                        {cert.issue_date
                          ? ` • ${new Date(cert.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`
                          : ''}
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
              <Stack gap={8}>
                <Row align="center" gap={8} justify="space-between">
                  <Row align="center" gap={8}>
                    <Briefcase size={18} color="secondary" />
                    <Text color="secondary">Recent Experience</Text>
                  </Row>
                  {experience.length > 3 && (
                    <Button size="sm" variant="outline" onPress={handleViewFullProfile}>
                      View All ({experience.length})
                    </Button>
                  )}
                </Row>
                <Stack gap={8}>
                  {recentExperience.map((exp) => (
                    <Stack key={exp.id} gap={4}>
                      <Text color="secondary">
                        {exp.job_title} at {exp.company_name}
                      </Text>
                      <Text color="secondary">
                        {formatDateRange(exp.start_date, exp.end_date ?? null, exp.is_current ?? false)}
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
              <Stack gap={8}>
                <Row align="center" gap={8}>
                  <GraduationCap size={18} color="#737373" />
                  <Text color="secondary">Education</Text>
                </Row>
                <Stack gap={8}>
                  {topEducation.map((edu) => (
                    <Stack key={edu.id} gap={4}>
                      <Text color="secondary">
                        {[edu.degree, edu.field_of_study].filter(Boolean).join(' ') || 'Education'}
                      </Text>
                      <Text color="secondary">
                        {edu.school_name}
                        {edu.end_date
                          ? ` • ${new Date(edu.end_date).toLocaleDateString('en-US', { year: 'numeric' })}`
                          : ''}
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
              <Row gap={8} wrap justify="center">
                {/* Connect Button */}
                {connectionButtonState && (
                  <>
                    {connectionButtonState.type === 'none' && (
                      <Button
                        size="md"
                        color="primary"
                        iconStart={isConnectionMutating ? Loader2 : UserPlus}
                        onPress={handleConnect}
                        disabled={isConnectionMutating}
                      >
                        {isConnectionMutating ? 'Sending...' : 'Connect'}
                      </Button>
                    )}

                    {connectionButtonState.type === 'pending_sent' && (
                      <Button size="md" variant="outline" iconStart={Loader2} disabled>
                        Pending
                      </Button>
                    )}

                    {connectionButtonState.type === 'pending_received' && (
                      <>
                        <Button
                          size="md"
                          color="primary"
                          iconStart={CheckCircle2}
                          onPress={handleAccept}
                          disabled={isConnectionMutating}
                        >
                          {isConnectionMutating ? 'Accepting...' : 'Accept'}
                        </Button>
                        <Button
                          size="md"
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
                      <Button size="md" variant="outline" iconStart={UserCheck} disabled>
                        Connected
                      </Button>
                    )}
                  </>
                )}

                {/* Follow Button */}
                {!followStatus.isLoading &&
                  (!followStatus.isFollowing ? (
                    <Button
                      size="md"
                      variant="outline"
                      iconStart={isFollowMutating ? Loader2 : UserPlus}
                      onPress={handleFollow}
                      disabled={isFollowMutating}
                    >
                      {isFollowMutating ? 'Following...' : 'Follow'}
                    </Button>
                  ) : (
                    <Button
                      size="md"
                      variant="outline"
                      iconStart={isFollowMutating ? Loader2 : UserMinus}
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
          <Stack gap={12}>
            {typeof window !== 'undefined' && (
              <Button
                size="lg"
                color="primary"
                variant="outline"
                iconEnd={ExternalLink}
                onPress={handleOpenInNewTab}
              >
                Open in New Tab
              </Button>
            )}
            <Button
              size="lg"
              color="primary"
              iconEnd={ExternalLink}
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
