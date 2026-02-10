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
      <Stack gap="$4" padding="$5">
        <Row gap="$2" alignItems="center">
          <BadgeCheck size={24} color="$blue10" />
          <Text fontSize="$7" fontWeight="700" color="$color12">
            Certifications
          </Text>
        </Row>

        <Stack gap="$3">
          {certifications.map((cert) => (
            <Card key={cert.id} bordered backgroundColor="$color2">
              <Stack gap="$2" padding="$4">
                <Text fontSize="$6" fontWeight="700" color="$color12">
                  {cert.name}
                </Text>
                {cert.issuing_organization && (
                  <Text fontSize="$4" color="$color11" fontWeight="600">
                    {cert.issuing_organization}
                  </Text>
                )}
                {(cert.issue_date || cert.expiration_date) && (
                  <Row gap="$2" alignItems="center">
                    <Calendar size={16} color="$color10" />
                    <Text fontSize="$3" color="$color10">
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
