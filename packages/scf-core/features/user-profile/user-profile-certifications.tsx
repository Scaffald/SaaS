import { BadgeCheck, Calendar } from 'lucide-react-native'
import { Card, Text, Row, Stack } from '@unicornlove/beyond-ui'

interface Certification {
  id: string
  name: string
  issuing_organization: string | null
  issue_date: string | null
  expiration_date: string | null
}

interface UserProfileCertificationsProps {
  certifications: Certification[]
}

export function UserProfileCertifications({ certifications }: UserProfileCertificationsProps) {
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
          <BadgeCheck size={24} color="$blue10" />
          <Text color="$gray11">Certifications</Text>
        </Row>

        <Stack gap={12}>
          {certifications.map((cert) => (
            <Card key={cert.id} bordered backgroundColor="$color2">
              <Stack gap={8} padding="md">
                <Text color="$gray11">{cert.name}</Text>
                {cert.issuing_organization && (
                  <Text color="$gray11">{cert.issuing_organization}</Text>
                )}
                {(cert.issue_date || cert.expiration_date) && (
                  <Row gap={8} align="center">
                    <Calendar size="md" color="$gray11" />
                    <Text color="$gray11">
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
