import { Briefcase, Calendar, MapPin } from '@tamagui/lucide-icons'
import { Card, Text, XStack, YStack } from '@unicornlove/ui'

interface Experience {
  id: string
  job_title: string | null
  company_name: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
  description: string | null
}

interface UserProfileExperienceProps {
  experience: Experience[]
}

export function UserProfileExperience({ experience }: UserProfileExperienceProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    })
  }

  return (
    <Card elevate bordered>
      <YStack gap="$4" padding="$5">
        <XStack gap="$2" alignItems="center">
          <Briefcase size={24} color="$blue10" />
          <Text fontSize="$7" fontWeight="700" color="$color12">
            Work Experience
          </Text>
        </XStack>

        <YStack gap="$3">
          {experience.map((exp) => (
            <Card key={exp.id} bordered backgroundColor="$color2">
              <YStack gap="$3" padding="$4">
                <YStack gap="$1">
                  <Text fontSize="$6" fontWeight="700" color="$color12">
                    {exp.job_title}
                  </Text>
                  {exp.company_name && (
                    <Text fontSize="$5" color="$color11" fontWeight="600">
                      {exp.company_name}
                    </Text>
                  )}
                </YStack>

                <XStack gap="$3" flexWrap="wrap">
                  {(exp.start_date || exp.end_date) && (
                    <XStack gap="$2" alignItems="center">
                      <Calendar size={16} color="$color10" />
                      <Text fontSize="$3" color="$color10">
                        {formatDate(exp.start_date)} -{' '}
                        {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                      </Text>
                    </XStack>
                  )}
                  {exp.location && (
                    <XStack gap="$2" alignItems="center">
                      <MapPin size={16} color="$color10" />
                      <Text fontSize="$3" color="$color10">
                        {exp.location}
                      </Text>
                    </XStack>
                  )}
                </XStack>

                {exp.description && (
                  <Text fontSize="$4" color="$color11" lineHeight={20}>
                    {exp.description}
                  </Text>
                )}
              </YStack>
            </Card>
          ))}
        </YStack>
      </YStack>
    </Card>
  )
}
