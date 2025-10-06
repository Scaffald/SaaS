import { YStack, XStack, Text, Button, Separator, ScrollView, Dialog, Spinner } from 'tamagui'
import {
  MapPin,
  Star,
  Award,
  BadgeCheck,
  ExternalLink,
  X,
  User,
  DollarSign,
} from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { api } from '@app/core/utils/api'

interface WorkerPreviewModalProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Worker Preview Modal
 * Shows a quick preview of a worker's profile with option to view full profile
 */
export function WorkerPreviewModal({ userId, open, onOpenChange }: WorkerPreviewModalProps) {
  const router = useRouter()

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

  const isLoading = profileLoading || skillsLoading || certsLoading

  const handleViewFullProfile = () => {
    if (userId) {
      router.push(`/dashboard/users/${userId}`)
      onOpenChange(false)
    }
  }

  const formatHourlyRate = (cents: number | null) => {
    if (!cents) return null
    const dollars = cents / 100
    return `$${dollars.toFixed(2)}/hr`
  }

  const topSkills = skills.slice(0, 5)
  const topCertifications = certifications.slice(0, 3)

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          w={600}
          maxH="85vh"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack gap="$4" p="$4">
              {/* Header with close button */}
              <XStack justify="space-between" items="flex-start">
                <YStack flex={1} />
                <Dialog.Close asChild>
                  <Button size="$3" circular icon={X} chromeless />
                </Dialog.Close>
              </XStack>

              {isLoading ? (
                <YStack py="$8" items="center" justify="center">
                  <Spinner size="large" color="$blue10" />
                  <Text mt="$4" color="$color11">
                    Loading profile...
                  </Text>
                </YStack>
              ) : !profile ? (
                <YStack py="$8" items="center">
                  <Text color="$red10" fontSize="$5" fontWeight="600">
                    Profile not found
                  </Text>
                </YStack>
              ) : (
                <>
                  {/* Profile Header */}
                  <YStack gap="$3" items="center">
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
                      <Text fontSize="$8" fontWeight="700" color="$color12" ta="center">
                        {profile.name}
                      </Text>
                      {profile.headline && (
                        <Text fontSize="$5" color="$color11" ta="center">
                          {profile.headline}
                        </Text>
                      )}
                    </YStack>

                    {/* Elevate Score Badge */}
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
                          Elevate Score
                        </Text>
                      </XStack>
                    )}
                  </YStack>

                  <Separator />

                  {/* Quick Info */}
                  <YStack gap="$3">
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

                    {profile.years_of_experience !== null && (
                      <XStack gap="$2" items="center">
                        <Award size={18} color="$color10" />
                        <Text fontSize="$4" color="$color11">
                          {profile.years_of_experience} years experience
                        </Text>
                      </XStack>
                    )}

                    {profile.open_to_work && (
                      <XStack bg="$green3" px="$3" py="$1.5" rounded="$3" als="flex-start">
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
                      <YStack gap="$3">
                        <XStack items="center" gap="$2">
                          <Award size={18} color="$color12" />
                          <Text fontSize="$5" fontWeight="600" color="$color12">
                            Top Skills
                          </Text>
                        </XStack>
                        <YStack gap="$2">
                          {topSkills.map((skill) => (
                            <XStack key={skill.id} justify="space-between" items="center">
                              <Text fontSize="$4" color="$color11">
                                {skill.name}
                              </Text>
                              <XStack gap="$2" items="center">
                                <YStack
                                  width={100}
                                  height={8}
                                  bg="$color4"
                                  rounded="$2"
                                  overflow="hidden"
                                >
                                  <YStack
                                    width={`${skill.proficiency}%`}
                                    height="100%"
                                    bg="$blue10"
                                  />
                                </YStack>
                                <YStack minWidth={30}>
                                  <Text fontSize="$3" color="$color10">
                                    {skill.proficiency}%
                                  </Text>
                                </YStack>
                              </XStack>
                            </XStack>
                          ))}
                        </YStack>
                      </YStack>
                    </>
                  )}

                  {/* Certifications */}
                  {topCertifications.length > 0 && (
                    <>
                      <Separator />
                      <YStack gap="$3">
                        <XStack items="center" gap="$2">
                          <BadgeCheck size={18} color="$color12" />
                          <Text fontSize="$5" fontWeight="600" color="$color12">
                            Certifications
                          </Text>
                        </XStack>
                        <YStack gap="$2">
                          {topCertifications.map((cert) => (
                            <YStack key={cert.id} gap="$1">
                              <Text fontSize="$4" fontWeight="600" color="$color12">
                                {cert.name}
                              </Text>
                              <Text fontSize="$3" color="$color10">
                                {cert.issuing_organization}
                              </Text>
                            </YStack>
                          ))}
                        </YStack>
                      </YStack>
                    </>
                  )}

                  <Separator />

                  {/* CTA Button */}
                  <Button
                    size="$5"
                    theme="blue"
                    iconAfter={<ExternalLink size={18} />}
                    onPress={handleViewFullProfile}
                  >
                    View Full Profile
                  </Button>
                </>
              )}
            </YStack>
          </ScrollView>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
