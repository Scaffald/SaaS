import { Calendar, GraduationCap } from 'lucide-react-native'
import { Card, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
      <Stack gap={16} padding="lg">
        <Row gap={8} align="center">
          <GraduationCap size={24} color="$blue10" />
          <Text color="$gray11">Education</Text>
        </Row>

        <Stack gap={12}>
          {education.map((edu) => (
            <Card key={edu.id} bordered backgroundColor="$color2">
              <Stack gap={8} padding="md">
                <Text color="$gray11">
                  {edu.degree_type}
                  {edu.field_of_study && ` in ${edu.field_of_study}`}
                </Text>
                {edu.institution_name && <Text color="$gray11">{edu.institution_name}</Text>}
                {(edu.start_date || edu.end_date) && (
                  <Row gap={8} align="center">
                    <Calendar size="md" color="$gray11" />
                    <Text color="$gray11">
                      {formatDate(edu.start_date)} -{' '}
                      {edu.is_current ? 'Present' : formatDate(edu.end_date)}
                    </Text>
                  </Row>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
