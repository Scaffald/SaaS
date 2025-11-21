import { RouteBuilder } from '@app/core/constants/routes'
import { formatDateRange } from '@app/core/features/profile/utils/date-formatting'
import { api } from '@app/core/utils/api'
import { useAdaptiveLoading } from '@app/core/utils/useAdaptiveLoading'
import { ResponsiveModal } from '@app/ui'
import {
  Award,
  BadgeCheck,
  Briefcase,
  DollarSign,
  ExternalLink,
  GraduationCap,
  MapPin,
  Star,
  User,
} from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

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
  const toast = useToastController()

  // Fetch worker profile data
  const { data: profile, isLoading: profileLoading } = api.userProfile.getUserProfile.useQuery(
    { userId: userId || '' },
    { enabled: !!userId && open }
  )

  // Fetch top skills
  const { data: skills = [], isLoading: skillsLoading } = api.userProfile.getUserSkills.useQuery(
    { userId: userId || '' },
    { enabled: !!userId && open }
  )

  // Fetch certifications
  const { data: certifications = [], isLoading: certsLoading } =
    api.userProfile.getUserCertifications.useQuery(
      { userId: userId || '' },
      { enabled: !!userId && open }
    )

  // Fetch work experience
  const { data: experience = [], isLoading: experienceLoading } =
    api.userProfile.getUserExperience.useQuery(
      { userId: userId || '' },
      { enabled: !!userId && open }
    )

  // Fetch education
  const { data: education = [], isLoading: educationLoading } =
    api.userProfile.getUserEducation.useQuery(
      { userId: userId || '' },
      { enabled: !!userId && open }
    )

  const isLoading =
    profileLoading || skillsLoading || certsLoading || experienceLoading || educationLoading
  const showLoading = useAdaptiveLoading(isLoading, 300)

  const handleViewFullProfile = () => {
    if (!userId) return

    try {
      router.push(RouteBuilder.discoverWorkerDetail(userId))
      onOpenChange(false)
    } catch (navigationError) {
      console.error('Failed to navigate to worker profile', navigationError)
      toast.show('Unable to load profile', {
        message: 'Please try again.',
      })
    }
  }

  const handleOpenInNewTab = () => {
    if (!userId) return
    if (typeof window !== 'undefined') {
      window.open(RouteBuilder.dashboardUser(userId), '_blank')
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
        <YStack py="$8" items="center" justify="center">
          <Spinner size="large" color="$blue10" />
          <Text mt="$4" color="$color11">
            Loading profile...
          </Text>
        </YStack>
      ) : isLoading ? null : !profile ? (
        <YStack py="$8" items="center">
          <Text color="$red10" fontSize="$5" fontWeight="600">
            Profile not found
          </Text>
        </YStack>
      ) : (
        <>
          {/* Profile Header */}
          <YStack gap="$2" items="center">
            {profile.avatar_url ? (
              <YStack width={96} height={96} rounded="$10" overflow="hidden" bg="$color3">
                <img
                  src={profile.avatar_url}
                  alt={profile.name || 'Worker'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </YStack>
            ) : (
              <YStack
                width={96}
                height={96}
                rounded="$10"
                bg="$blue4"
                items="center"
                justify="center"
              >
                <User size={48} color="$blue10" />
              </YStack>
            )}

            <YStack gap="$2" items="center">
              <Text fontSize="$8" fontWeight="700" color="$color12">
                {profile.name}
              </Text>
              {profile.headline && (
                <Text fontSize="$5" color="$color11">
                  {profile.headline}
                </Text>
              )}
            </YStack>

            {/* Scaffald Score Badge */}
            {profile.gamified_score !== null && (
              <XStack
                bg="$blue2"
                px="$4"
                py="$2"
                rounded="$10"
                gap="$2"
                items="center"
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
              </XStack>
            )}
          </YStack>

          <Separator />

          {/* Quick Info */}
          <YStack gap="$2">
            {profile.location && (
              <XStack gap="$2" items="center">
                <MapPin size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {profile.location}
                </Text>
              </XStack>
            )}

            {profile.hourly_rate_cents && (
              <XStack gap="$2" items="center">
                <DollarSign size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {formatHourlyRate(profile.hourly_rate_cents)}
                </Text>
              </XStack>
            )}

            {resolveYearsOfExperience(
              typeof profile?.calculatedYearsOfExperience === 'number'
                ? profile.calculatedYearsOfExperience
                : (profile.years_of_experience ?? null)
            ) !== null && (
              <XStack gap="$2" items="center">
                <Award size={18} color="$color10" />
                <Text fontSize="$4" color="$color11">
                  {resolveYearsOfExperience(
                    typeof profile?.calculatedYearsOfExperience === 'number'
                      ? profile.calculatedYearsOfExperience
                      : (profile.years_of_experience ?? null)
                  )}{' '}
                  years experience
                </Text>
              </XStack>
            )}

            {profile.open_to_work && (
              <XStack bg="$green3" px="$3" py="$1.5" rounded="$3">
                <Text fontSize="$3" fontWeight="600" color="$green11">
                  Available for Work
                </Text>
              </XStack>
            )}
          </YStack>

          {/* Bio */}
          {profile.bio && (
            <>
              <Separator />
              <YStack gap="$2">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  About
                </Text>
                <Text fontSize="$4" color="$color11" lineHeight="$1" numberOfLines={4}>
                  {profile.bio}
                </Text>
              </YStack>
            </>
          )}

          {/* Top Skills */}
          {topSkills.length > 0 && (
            <>
              <Separator />
              <YStack gap="$2">
                <XStack items="center" gap="$2" justify="space-between">
                  <XStack items="center" gap="$2">
                    <Award size={18} color="$color12" />
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Top Skills
                    </Text>
                  </XStack>
                  {skills.length > 10 && (
                    <Button size="$2" variant="outlined" onPress={handleViewFullProfile}>
                      View All ({skills.length})
                    </Button>
                  )}
                </XStack>
                <YStack gap="$2">
                  {topSkills.map((skill: EnrichedSkill) => {
                    const label =
                      typeof skill.label === 'string'
                        ? skill.label
                        : skill.displayCode
                          ? `${skill.displayCode} · ${skill.name}`
                          : skill.name
                    return (
                      <XStack key={skill.id} justify="space-between" items="center">
                        <Text fontSize="$4" color="$color11">
                          {label}
                        </Text>
                        <XStack gap="$2" items="center">
                          <YStack
                            width={100}
                            height={8}
                            bg="$color4"
                            rounded="$2"
                            overflow="hidden"
                          >
                            <YStack width={`${skill.proficiency}%`} height="100%" bg="$blue10" />
                          </YStack>
                          <YStack minW={30}>
                            <Text fontSize="$3" color="$color10">
                              {skill.proficiency}%
                            </Text>
                          </YStack>
                        </XStack>
                      </XStack>
                    )
                  })}
                </YStack>
              </YStack>
            </>
          )}

          {/* Certifications */}
          {topCertifications.length > 0 && (
            <>
              <Separator />
              <YStack gap="$2">
                <XStack items="center" gap="$2" justify="space-between">
                  <XStack items="center" gap="$2">
                    <BadgeCheck size={18} color="$color12" />
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Certifications
                    </Text>
                  </XStack>
                  {certifications.length > 5 && (
                    <Button size="$2" variant="outlined" onPress={handleViewFullProfile}>
                      View All ({certifications.length})
                    </Button>
                  )}
                </XStack>
                <YStack gap="$2">
                  {topCertifications.map((cert: Certification) => (
                    <YStack key={cert.id} gap="$1">
                      <Text fontSize="$4" fontWeight="600" color="$color12">
                        {cert.name}
                      </Text>
                      <Text fontSize="$3" color="$color10">
                        {cert.issuing_organization}
                        {cert.issue_date &&
                          ` • ${new Date(cert.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}`}
                      </Text>
                    </YStack>
                  ))}
                </YStack>
              </YStack>
            </>
          )}

          {/* Work Experience */}
          {recentExperience.length > 0 && (
            <>
              <Separator />
              <YStack gap="$2">
                <XStack items="center" gap="$2" justify="space-between">
                  <XStack items="center" gap="$2">
                    <Briefcase size={18} color="$color12" />
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      Recent Experience
                    </Text>
                  </XStack>
                  {experience.length > 3 && (
                    <Button size="$2" variant="outlined" onPress={handleViewFullProfile}>
                      View All ({experience.length})
                    </Button>
                  )}
                </XStack>
                <YStack gap="$2">
                  {recentExperience.map((exp: ExperienceEntry) => (
                    <YStack key={exp.id} gap="$1">
                      <Text fontSize="$4" fontWeight="600" color="$color12">
                        {exp.job_title} at {exp.company_name}
                      </Text>
                      <Text fontSize="$3" color="$color10">
                        {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                      </Text>
                    </YStack>
                  ))}
                </YStack>
              </YStack>
            </>
          )}

          {/* Education */}
          {topEducation.length > 0 && (
            <>
              <Separator />
              <YStack gap="$2">
                <XStack items="center" gap="$2">
                  <GraduationCap size={18} color="$color12" />
                  <Text fontSize="$5" fontWeight="600" color="$color12">
                    Education
                  </Text>
                </XStack>
                <YStack gap="$2">
                  {topEducation.map((edu: EducationEntry) => (
                    <YStack key={edu.id} gap="$1">
                      <Text fontSize="$4" fontWeight="600" color="$color12">
                        {edu.degree_type} {edu.degree_name}
                      </Text>
                      <Text fontSize="$3" color="$color10">
                        {edu.university_name}
                        {edu.graduation_year && ` • ${edu.graduation_year}`}
                      </Text>
                    </YStack>
                  ))}
                </YStack>
              </YStack>
            </>
          )}

          <Separator />

          {/* CTA Buttons */}
          <YStack gap="$3">
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
          </YStack>
        </>
      )}
    </ResponsiveModal>
  )
}
