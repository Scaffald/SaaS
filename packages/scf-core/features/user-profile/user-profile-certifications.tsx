import { BadgeCheck, Calendar } from 'lucide-react-native'
import { Card, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

export interface UserProfileCertification {
  id: string
  name: string
  issuing_organization: string | null
  issue_date: string | null
  expiration_date: string | null
}

interface UserProfileCertificationsProps {
  certifications: UserProfileCertification[]
}

export function UserProfileCertifications({ certifications }: UserProfileCertificationsProps) {
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
          <BadgeCheck size={24} color={t === 'dark' ? colors.blue[300] : colors.blue[600]} />
          <Text style={{ color: colors.text[t].secondary }}>Certifications</Text>
        </Row>

        <Stack gap={12}>
          {certifications.map((cert) => (
            <Card key={cert.id} bordered style={{ backgroundColor: colors.bg[t].muted }}>
              <Stack gap={8} padding="md">
                <Text style={{ color: colors.text[t].secondary }}>{cert.name}</Text>
                {cert.issuing_organization && (
                  <Text style={{ color: colors.text[t].secondary }}>{cert.issuing_organization}</Text>
                )}
                {(cert.issue_date || cert.expiration_date) && (
                  <Row gap={8} align="center">
                    <Calendar size={20} color={colors.text[t].secondary} />
                    <Text style={{ color: colors.text[t].secondary }}>
                      {cert.issue_date && `Issued ${formatDate(cert.issue_date)}`}
                      {cert.issue_date && cert.expiration_date && ' • '}
                      {cert.expiration_date && `Expires ${formatDate(cert.expiration_date)}`}
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
