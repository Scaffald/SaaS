import { YStack, XStack, Text, H3, H4, ScrollView, Separator } from 'tamagui'
import { GraduationCap, Calendar, Award, MapPin } from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { format } from 'date-fns'

/**
 * Profile Education Right Component
 * Displays list of user's education history
 */
export function ProfileEducationRight() {
  // @ts-ignore - Profile router will be available after type generation
  const { data: educationEntries, isLoading } = api.profile?.getEducation?.useQuery() || {
    data: [],
    isLoading: false,
  }

  // @ts-ignore - Profile router will be available after type generation
  const { data: levelData } = api.profile?.getEducationLevel?.useQuery() || {
    data: { education_level: null },
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
          <H3>Your Education</H3>
          <Text color="$color11" fontSize="$3">
            {educationEntries?.length || 0} education entr
            {(educationEntries?.length || 0) !== 1 ? 'ies' : 'y'} on record
          </Text>
          {levelData?.education_level && (
            <Text color="$color11" fontSize="$2">
              Highest Level: {levelData.education_level}
            </Text>
          )}
        </YStack>

        {isLoading && (
          <YStack p="$4" items="center">
            <Text color="$color11">Loading education history...</Text>
          </YStack>
        )}

        {!isLoading && (!educationEntries || educationEntries.length === 0) && (
          <YStack
            p="$4"
            items="center"
            gap="$2"
            bg="$background"
            rounded="$4"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <GraduationCap size={48} color="$color11" />
            <Text color="$color11">
              No education history yet. Add your first education entry using the form on the left.
            </Text>
          </YStack>
        )}

        {educationEntries && educationEntries.length > 0 && (
          <YStack gap="$3">
            {/* biome-ignore lint/suspicious/noExplicitAny: tRPC types not yet generated */}
            {educationEntries.map((edu: any) => (
              <YStack
                key={edu.id}
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
                      <H4>{edu.institution_name}</H4>
                      {edu.degree_type && (
                        <Text color="$color11" fontSize="$3" fontWeight="600">
                          {edu.degree_type}
                          {edu.field_of_study && ` in ${edu.field_of_study}`}
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                </YStack>

                <Separator />

                {/* Details */}
                <YStack gap="$2">
                  {/* Dates */}
                  {(edu.start_date || edu.end_date) && (
                    <XStack gap="$2" items="center">
                      <Calendar size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {formatDateRange(edu.start_date, edu.end_date, edu.is_current)}
                      </Text>
                    </XStack>
                  )}

                  {/* Location */}
                  {edu.location && (
                    <XStack gap="$2" items="center">
                      <MapPin size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {edu.location}
                      </Text>
                    </XStack>
                  )}

                  {/* GPA and Honors */}
                  {(edu.gpa || (edu.honors && edu.honors.length > 0)) && (
                    <XStack gap="$3" flexWrap="wrap">
                      {edu.gpa && (
                        <XStack gap="$2" items="center">
                          <Text fontSize="$2" color="$color11" fontWeight="600">
                            GPA: {edu.gpa.toFixed(2)}
                          </Text>
                        </XStack>
                      )}
                      {edu.honors && edu.honors.length > 0 && (
                        <XStack gap="$2" items="center">
                          <Award size={16} color="$color11" />
                          <Text fontSize="$2" color="$color11">
                            {edu.honors.join(', ')}
                          </Text>
                        </XStack>
                      )}
                    </XStack>
                  )}

                  {/* Activities */}
                  {edu.activities && (
                    <YStack gap="$1">
                      <Text fontSize="$2" fontWeight="600" color="$color11">
                        Activities & Societies:
                      </Text>
                      <Text fontSize="$2" color="$color11">
                        {edu.activities}
                      </Text>
                    </YStack>
                  )}

                  {/* Description */}
                  {edu.description && (
                    <YStack gap="$1">
                      <Text fontSize="$2" fontWeight="600" color="$color11">
                        Description:
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        {edu.description}
                      </Text>
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
