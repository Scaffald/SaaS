import { YStack, XStack, Text, H3, H4, ScrollView, Button, Separator } from 'tamagui'
import {
  Download,
  ExternalLink,
  Calendar,
  Award,
  CheckCircle,
  AlertCircle,
  Clock,
} from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { format } from 'date-fns'

/**
 * Profile Certifications Right Component
 * Displays list of user's certifications with download/view links
 */
export function ProfileCertificationsRight() {
  // @ts-ignore - Profile router will be available after type generation
  const { data: certifications, isLoading } = api.profile?.getCertifications?.useQuery() || {
    data: [],
    isLoading: false,
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <XStack gap="$2" items="center">
            <CheckCircle size={16} color="$green10" />
            <Text color="$green10" fontSize="$2" fontWeight="600">
              Verified
            </Text>
          </XStack>
        )
      case 'pending':
        return (
          <XStack gap="$2" items="center">
            <Clock size={16} color="$red10" />
            <Text color="$red10" fontSize="$2" fontWeight="600">
              Pending
            </Text>
          </XStack>
        )
      default:
        return (
          <XStack gap="$2" items="center">
            <AlertCircle size={16} color="$color10" />
            <Text color="$color10" fontSize="$2">
              Not Verified
            </Text>
          </XStack>
        )
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A'
    try {
      return format(new Date(dateStr), 'MMM yyyy')
    } catch {
      return dateStr
    }
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$4" p="$4">
        <YStack gap="$2">
          <H3>Your Certifications</H3>
          <Text color="$color11" fontSize="$3">
            {certifications?.length || 0} certification
            {(certifications?.length || 0) !== 1 ? 's' : ''} on record
          </Text>
        </YStack>

        {isLoading && (
          <YStack p="$4" items="center">
            <Text color="$color11">Loading certifications...</Text>
          </YStack>
        )}

        {!isLoading && (!certifications || certifications.length === 0) && (
          <YStack
            p="$4"
            items="center"
            gap="$2"
            bg="$background"
            rounded="$4"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Award size={48} color="$color11" />
            <Text color="$color11" text="center">
              No certifications yet. Add your first certification using the form on the left.
            </Text>
          </YStack>
        )}

        {certifications && certifications.length > 0 && (
          <YStack gap="$3">
            {/* biome-ignore lint/suspicious/noExplicitAny: API response type */}
            {certifications.map((cert: any) => (
              <YStack
                key={cert.id}
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
                      <H4>{cert.name}</H4>
                      <Text color="$color11" fontSize="$3">
                        {cert.issuing_organization}
                      </Text>
                    </YStack>
                    {getVerificationBadge(cert.verification_status)}
                  </XStack>
                </YStack>

                <Separator />

                {/* Details */}
                <YStack gap="$2">
                  {/* Dates */}
                  <XStack gap="$2" items="center">
                    <Calendar size={16} color="$color11" />
                    <Text fontSize="$2" color="$color11">
                      Issued: {formatDate(cert.issue_date)}
                      {cert.expiration_date && ` • Expires: ${formatDate(cert.expiration_date)}`}
                    </Text>
                  </XStack>

                  {/* Credential ID */}
                  {cert.credential_id && (
                    <Text fontSize="$2" color="$color11">
                      Credential ID: {cert.credential_id}
                    </Text>
                  )}

                  {/* Description */}
                  {cert.description && (
                    <Text fontSize="$3" color="$color11">
                      {cert.description}
                    </Text>
                  )}
                </YStack>

                {/* Actions */}
                {(cert.credential_url || cert.certificate_file_path) && (
                  <>
                    <Separator />
                    <XStack gap="$2" flexWrap="wrap">
                      {cert.credential_url && (
                        <Button
                          size="$2"
                          variant="outlined"
                          icon={ExternalLink}
                          onPress={() => {
                            // Open URL in browser
                            if (typeof window !== 'undefined') {
                              window.open(cert.credential_url || '', '_blank')
                            }
                          }}
                        >
                          View Online
                        </Button>
                      )}
                      {cert.certificate_file_path && (
                        <Button
                          size="$2"
                          variant="outlined"
                          icon={Download}
                          onPress={() => {
                            // Download file
                            const supabaseUrl =
                              process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
                            const fileUrl = `${supabaseUrl}/storage/v1/object/public/certifications/${cert.certificate_file_path}`
                            if (typeof window !== 'undefined') {
                              window.open(fileUrl, '_blank')
                            }
                          }}
                        >
                          Download Certificate
                        </Button>
                      )}
                    </XStack>
                  </>
                )}
              </YStack>
            ))}
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}
