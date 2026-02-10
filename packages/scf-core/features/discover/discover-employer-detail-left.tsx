import { ROUTES } from '@scf/core/constants/routes'
import { useEmployer } from '@scf/core/utils/employers-sdk-hooks'
import { DashboardWidget, extractPlainText } from '@unicornlove/beyond-ui'
import { ArrowLeft, Building2, ExternalLink, MapPin, Users } from 'lucide-react-native'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'expo-router'
import { Button, Separator, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

type DiscoverEmployerDetailLeftProps = {
  employerId: string
}

/**
 * DiscoverEmployerDetailLeft
 * Displays the primary organization information within the dashboard layout.
 */
export function DiscoverEmployerDetailLeft({ employerId }: DiscoverEmployerDetailLeftProps) {
  const router = useRouter()

  const {
    data: employer,
    isLoading,
    isFetching,
  } = useEmployer({ id: employerId }, { enabled: Boolean(employerId) })

  if (!employerId) {
    return (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" padding="$8" gap="$3">
          <Text fontSize="$5" fontWeight="600" color="$color12">
            Employer not specified
          </Text>
          <Button
            onPress={() => {
              // Try to go back, fallback to employers list if no history
              try {
                router.back()
              } catch {
                router.replace(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path)
              }
            }}
          >
            Go Back
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  if (isLoading || isFetching) {
    return (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" padding="$8" gap="$3">
          <Spinner size="large" color="$blue10" />
          <Text color="$color11">Loading employer details...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!employer) {
    return (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" padding="$8" gap="$3">
          <Text color="$red10" fontSize="$5" fontWeight="600">
            Employer not found
          </Text>
          <Button
            onPress={() => {
              // Try to go back, fallback to employers list if no history
              try {
                router.back()
              } catch {
                router.replace(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path)
              }
            }}
          >
            Go Back
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  const websiteUrl = employer.website
    ? employer.website.startsWith('http')
      ? employer.website
      : `https://${employer.website}`
    : null

  return (
    <DashboardWidget gap="$4">
      {/* Header with Back Button */}
      <Row alignItems="center" gap="$3">
        <Button
          size="$3"
          variant="outlined"
          icon={ArrowLeft}
          onPress={() => {
            // Try to go back, fallback to employers list if no history
            try {
              router.back()
            } catch {
              router.replace(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path)
            }
          }}
        >
          Back
        </Button>
        <Row alignItems="center" gap="$2" flex={1}>
          <Building2 size={24} color="$blue10" />
          <Text fontSize="$8" fontWeight="700">
            {employer.name}
          </Text>
        </Row>
      </Row>

      <Separator />

      {/* Industry */}
      {employer.industries && (
        <Stack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Industry
          </Text>
          <Row alignItems="center" gap="$2">
            <Users size={16} color="$color11" />
            <Text fontSize="$4" color="$color11">
              {employer.industries.name}
            </Text>
          </Row>
        </Stack>
      )}

      {/* Description */}
      {employer.description && (
        <Stack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            About
          </Text>
          <Text fontSize="$4" color="$color11">
            {typeof employer.description === 'string'
              ? employer.description
              : extractPlainText(employer.description as JSONContent)}
          </Text>
        </Stack>
      )}

      {/* Location */}
      {employer.address && (
        <Stack gap="$2">
          <Row alignItems="center" gap="$2">
            <MapPin size={18} color="$color10" />
            <Text fontSize="$5" fontWeight="600">
              Location
            </Text>
          </Row>
          <Text fontSize="$4" color="$color11">
            {employer.address.street || employer.address.zipCode || 'Not specified'}
          </Text>
        </Stack>
      )}

      {/* Website */}
      {websiteUrl && (
        <Stack gap="$2">
          <Button
            size="$4"
            variant="outlined"
            icon={ExternalLink}
            onPress={() => {
              if (typeof window !== 'undefined') {
                window.open(websiteUrl, '_blank')
              }
            }}
          >
            Visit Website
          </Button>
        </Stack>
      )}

      {/* Additional Info */}
      <Stack gap="$2">
        <Text fontSize="$3" color="$color10">
          Created: {new Date(employer.created_at).toLocaleDateString()}
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
