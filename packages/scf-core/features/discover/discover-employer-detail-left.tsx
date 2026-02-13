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
        <Stack align="center" justify="center" padding={32} gap={12}>
          <Text color="$gray11">Employer not specified</Text>
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
        <Stack align="center" justify="center" padding={32} gap={12}>
          <Spinner size="lg" color="$blue10" />
          <Text color="$gray11">Loading employer details...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!employer) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" padding={32} gap={12}>
          <Text color="$red10">Employer not found</Text>
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
    <DashboardWidget gap={16}>
      {/* Header with Back Button */}
      <Row align="center" gap={12}>
        <Button
          size="sm"
          variant="outline"
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
        <Row align="center" gap={8} flex={1}>
          <Building2 size={24} color="$blue10" />
          <Text>{employer.name}</Text>
        </Row>
      </Row>

      <Separator />

      {/* Industry */}
      {employer.industries && (
        <Stack gap={8}>
          <Text>Industry</Text>
          <Row align="center" gap={8}>
            <Users size="md" color="$gray11" />
            <Text color="$gray11">{employer.industries.name}</Text>
          </Row>
        </Stack>
      )}

      {/* Description */}
      {employer.description && (
        <Stack gap={8}>
          <Text>About</Text>
          <Text color="$gray11">
            {typeof employer.description === 'string'
              ? employer.description
              : extractPlainText(employer.description as JSONContent)}
          </Text>
        </Stack>
      )}

      {/* Location */}
      {employer.address && (
        <Stack gap={8}>
          <Row align="center" gap={8}>
            <MapPin size={18} color="$gray11" />
            <Text>Location</Text>
          </Row>
          <Text color="$gray11">
            {employer.address.street || employer.address.zipCode || 'Not specified'}
          </Text>
        </Stack>
      )}

      {/* Website */}
      {websiteUrl && (
        <Stack gap={8}>
          <Button
            size="md"
            variant="outline"
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
      <Stack gap={8}>
        <Text color="$gray11">Created: {new Date(employer.created_at).toLocaleDateString()}</Text>
      </Stack>
    </DashboardWidget>
  )
}
