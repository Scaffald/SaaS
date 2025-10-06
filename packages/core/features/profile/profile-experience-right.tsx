import { YStack, XStack, Text, H3, H4, ScrollView, Separator } from 'tamagui'
import { Briefcase, Calendar, MapPin, Building2, TrendingUp } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { format } from 'date-fns'
import { randomUUID } from 'expo-crypto'

/**
 * Profile Experience Right Component
 * Displays list of user's work experience history
 */
export function ProfileExperienceRight() {
  // @ts-ignore - Profile router will be available after type generation
  const { data: experienceEntries, isLoading } = api.profile?.getExperience?.useQuery() || {
    data: [],
    isLoading: false,
  }

  // @ts-ignore - Profile router will be available after type generation
  const { data: summaryData } = api.profile?.getExperienceSummary?.useQuery() || {
    data: { total_years_experience: null, career_level: null },
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A'
    try {
      return format(new Date(dateStr), 'MMM yyyy')
    } catch {
      return dateStr
    }
  }

  const formatDateRange = (
    startDate: string | null | undefined,
    endDate: string | null | undefined,
    isCurrent: boolean
  ) => {
    const start = formatDate(startDate)
    const end = isCurrent ? 'Present' : formatDate(endDate)
    return `${start} - ${end}`
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" p="$4">
        <YStack gap="$2">
          <H3>Your Experience</H3>
          <Text color="$color11" fontSize="$3">
            {experienceEntries?.length || 0} experience entr
            {(experienceEntries?.length || 0) !== 1 ? 'ies' : 'y'} on record
          </Text>
          <XStack gap="$4" flexWrap="wrap">
            {summaryData?.total_years_experience && (
              <Text color="$color11" fontSize="$2">
                Total Experience: {summaryData.total_years_experience} years
              </Text>
            )}
            {summaryData?.career_level && (
              <Text color="$color11" fontSize="$2">
                Career Level: {summaryData.career_level}
              </Text>
            )}
          </XStack>
        </YStack>

        {isLoading && (
          <YStack p="$4" items="center">
            <Text color="$color11">Loading work experience...</Text>
          </YStack>
        )}

        {!isLoading && (!experienceEntries || experienceEntries.length === 0) && (
          <YStack
            p="$4"
            items="center"
            gap="$2"
            bg="$background"
            rounded="$4"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Briefcase size={48} color="$color11" />
            <Text color="$color11">
              No work experience yet. Add your first experience entry using the form on the left.
            </Text>
          </YStack>
        )}

        {experienceEntries && experienceEntries.length > 0 && (
          <YStack gap="$3">
            {/* biome-ignore lint/suspicious/noExplicitAny: tRPC types not yet generated */}
            {experienceEntries.map((exp: any) => (
              <YStack
                key={exp.id}
                gap="$3"
                p="$4"
                bg="$background"
                rounded="$4"
                borderWidth={1}
                borderColor="$borderColor"
              >
                {/* Header */}
                <YStack gap="$2">
                  <XStack justify="space-between" items="flex-start">
                    <YStack gap="$1" flex={1}>
                      <H4>{exp.job_title}</H4>
                      <XStack gap="$2" items="center" flexWrap="wrap">
                        <Text color="$color11" fontSize="$3" fontWeight="600">
                          {exp.company_name}
                        </Text>
                        {exp.employment_type && (
                          <>
                            <Text color="$color11" fontSize="$2">
                              •
                            </Text>
                            <Text color="$color11" fontSize="$2">
                              {exp.employment_type}
                            </Text>
                          </>
                        )}
                        {exp.is_current && (
                          <>
                            <Text color="$color11" fontSize="$2">
                              •
                            </Text>
                            <Text color="$green10" fontSize="$2" fontWeight="600">
                              Current Position
                            </Text>
                          </>
                        )}
                      </XStack>
                    </YStack>
                  </XStack>
                </YStack>

                <Separator />

                {/* Details */}
                <YStack gap="$2">
                  {/* Dates */}
                  {(exp.start_date || exp.end_date) && (
                    <XStack gap="$2" items="center">
                      <Calendar size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                      </Text>
                    </XStack>
                  )}

                  {/* Location */}
                  {exp.location && (
                    <XStack gap="$2" items="center">
                      <MapPin size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {exp.location}
                        {exp.is_remote && ' (Remote)'}
                      </Text>
                    </XStack>
                  )}

                  {/* Company Size */}
                  {exp.company_size && (
                    <XStack gap="$2" items="center">
                      <Building2 size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {exp.company_size}
                      </Text>
                    </XStack>
                  )}

                  {/* Industry */}
                  {exp.industry && (
                    <XStack gap="$2" items="center">
                      <TrendingUp size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {exp.industry}
                      </Text>
                    </XStack>
                  )}

                  {/* Description */}
                  {exp.description && (
                    <YStack gap="$1">
                      <Text fontSize="$2" fontWeight="600" color="$color11">
                        Description:
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        {exp.description}
                      </Text>
                    </YStack>
                  )}

                  {/* Key Achievements */}
                  {exp.key_achievements && exp.key_achievements.length > 0 && (
                    <YStack gap="$1">
                      <Text fontSize="$2" fontWeight="600" color="$color11">
                        Key Achievements:
                      </Text>
                      <YStack gap="$1" pl="$2">
                        {exp.key_achievements.map((achievement: string) => (
                          <XStack key={randomUUID()} gap="$2">
                            <Text fontSize="$2" color="$color11">
                              •
                            </Text>
                            <Text fontSize="$2" color="$color11" flex={1}>
                              {achievement}
                            </Text>
                          </XStack>
                        ))}
                      </YStack>
                    </YStack>
                  )}

                  {/* Skills Used */}
                  {exp.skills_used && exp.skills_used.length > 0 && (
                    <YStack gap="$1">
                      <Text fontSize="$2" fontWeight="600" color="$color11">
                        Skills:
                      </Text>
                      <XStack gap="$2" flexWrap="wrap">
                        {exp.skills_used.map((skill: string) => (
                          <XStack
                            key={randomUUID()}
                            px="$2"
                            py="$1"
                            bg="$backgroundHover"
                            rounded="$2"
                            borderWidth={1}
                            borderColor="$borderColor"
                          >
                            <Text fontSize="$2" color="$color11">
                              {skill}
                            </Text>
                          </XStack>
                        ))}
                      </XStack>
                    </YStack>
                  )}
                </YStack>
              </YStack>
            ))}
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}
