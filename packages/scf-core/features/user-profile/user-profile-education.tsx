import { Calendar, GraduationCap } from 'lucide-react-native'
import { Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export interface UserProfileEducationEntry {
  id: string
  degree_type: string | null
  institution_name: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
}

interface UserProfileEducationProps {
  education: UserProfileEducationEntry[]
}

export function UserProfileEducation({ education }: UserProfileEducationProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light' as const

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
          <GraduationCap size={24} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
          <Text style={{ color: colors.text[t].secondary }}>Education</Text>
        </Row>

        <Stack gap={12}>
          {education.map((edu) => (
            <Card key={edu.id} bordered style={{ backgroundColor: colors.bg[t].muted }}>
              <Stack gap={8} padding="md">
                <Text style={{ color: colors.text[t].secondary }}>
                  {edu.degree_type}
                  {edu.field_of_study && ` in ${edu.field_of_study}`}
                </Text>
                {edu.institution_name && <Text style={{ color: colors.text[t].secondary }}>{edu.institution_name}</Text>}
                {(edu.start_date || edu.end_date) && (
                  <Row gap={8} align="center">
                    <Calendar size={20} color={colors.text[t].secondary} />
                    <Text style={{ color: colors.text[t].secondary }}>
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
