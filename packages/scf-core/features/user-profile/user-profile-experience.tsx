import { Briefcase, Calendar, MapPin } from 'lucide-react-native'
import { Card, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
      <Stack gap={16} padding="lg">
        <Row gap={8} align="center">
          <Briefcase size={24} color="$blue10" />
          <Text color="$gray11">Work Experience</Text>
        </Row>

        <Stack gap={12}>
          {experience.map((exp) => (
            <Card key={exp.id} bordered backgroundColor="$color2">
              <Stack gap={12} padding="md">
                <Stack gap={4}>
                  <Text color="$gray11">{exp.job_title}</Text>
                  {exp.company_name && <Text color="$gray11">{exp.company_name}</Text>}
                </Stack>

                <Row gap={12} flexWrap="wrap">
                  {(exp.start_date || exp.end_date) && (
                    <Row gap={8} align="center">
                      <Calendar size="md" color="$gray11" />
                      <Text color="$gray11">
                        {formatDate(exp.start_date)} -{' '}
                        {exp.is_current ? 'Present' : formatDate(exp.end_date)}
                      </Text>
                    </Row>
                  )}
                  {exp.location && (
                    <Row gap={8} align="center">
                      <MapPin size="md" color="$gray11" />
                      <Text color="$gray11">{exp.location}</Text>
                    </Row>
                  )}
                </Row>

                {exp.description && (
                  <Text color="$gray11" lineHeight={20}>
                    {exp.description}
                  </Text>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
