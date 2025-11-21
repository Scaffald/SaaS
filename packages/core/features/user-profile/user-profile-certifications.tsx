import { BadgeCheck, Calendar } from '@tamagui/lucide-icons'
import { Card, Text, XStack, YStack } from 'tamagui'

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
      <YStack gap="$4" p="$5">
        <XStack gap="$2" items="center">
          <BadgeCheck size={24} color="$blue10" />
          <Text fontSize="$7" fontWeight="700" color="$color12">
            Certifications
          </Text>
        </XStack>

        <YStack gap="$3">
          {certifications.map((cert) => (
            <Card key={cert.id} bordered bg="$color2">
              <YStack gap="$2" p="$4">
                <Text fontSize="$6" fontWeight="700" color="$color12">
                  {cert.name}
                </Text>
                {cert.issuing_organization && (
                  <Text fontSize="$4" color="$color11" fontWeight="600">
                    {cert.issuing_organization}
                  </Text>
                )}
                {(cert.issue_date || cert.expiration_date) && (
                  <XStack gap="$2" items="center">
                    <Calendar size={16} color="$color10" />
                    <Text fontSize="$3" color="$color10">
                      {cert.issue_date && `Issued ${formatDate(cert.issue_date)}`}
                      {cert.issue_date && cert.expiration_date && ' • '}
                      {cert.expiration_date && `Expires ${formatDate(cert.expiration_date)}`}
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
