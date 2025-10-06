import { YStack, XStack, Text, Card } from 'tamagui'
import { GraduationCap, Calendar } from '@tamagui/lucide-icons'

interface Education {
  id: string
  degree_type: string | null
  institution_name: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
}

interface UserProfileEducationProps {
  education: Education[]
}

export function UserProfileEducation({ education }: UserProfileEducationProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    })
  }

  return (
    <Card elevate bordered>
      <YStack gap="$4" p="$5">
        <XStack gap="$2" items="center">
          <GraduationCap size={24} color="$blue10" />
          <Text fontSize="$7" fontWeight="700" color="$color12">
            Education
          </Text>
        </XStack>

        <YStack gap="$3">
          {education.map((edu) => (
            <Card key={edu.id} bordered bg="$color2">
              <YStack gap="$2" p="$4">
                <Text fontSize="$6" fontWeight="700" color="$color12">
                  {edu.degree_type}
                  {edu.field_of_study && ` in ${edu.field_of_study}`}
                </Text>
                {edu.institution_name && (
                  <Text fontSize="$5" color="$color11" fontWeight="600">
                    {edu.institution_name}
                  </Text>
                )}
                {(edu.start_date || edu.end_date) && (
                  <XStack gap="$2" items="center">
                    <Calendar size={16} color="$color10" />
                    <Text fontSize="$3" color="$color10">
                      {formatDate(edu.start_date)} -{' '}
                      {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                    </Text>
                  </XStack>
                )}
              </YStack>
            </Card>
          ))}
        </YStack>
      </YStack>
    </Card>
  )
}
