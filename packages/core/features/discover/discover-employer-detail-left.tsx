import { ROUTES } from '@app/core/constants/routes'
import { api } from '@app/core/utils/api'
import { DashboardWidget, extractPlainText } from '@app/ui'
import { ArrowLeft, Building2, ExternalLink, MapPin, Users } from '@tamagui/lucide-icons'
import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'expo-router'
import { Button, Separator, Spinner, Text, XStack, YStack } from 'tamagui'

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
  } = api.employers.getEmployerById.useQuery({ id: employerId }, { enabled: Boolean(employerId) })

  if (!employerId) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$3">
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
        </YStack>
      </DashboardWidget>
    )
  }

  if (isLoading || isFetching) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$3">
          <Spinner size="large" color="$blue10" />
          <Text color="$color11">Loading employer details...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  if (!employer) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$3">
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
        </YStack>
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
      <XStack items="center" gap="$3">
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
        <XStack items="center" gap="$2" flex={1}>
          <Building2 size={24} color="$blue10" />
          <Text fontSize="$8" fontWeight="700">
            {employer.name}
          </Text>
        </XStack>
      </XStack>

      <Separator />

      {/* Industry */}
      {employer.industries && (
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Industry
          </Text>
          <XStack items="center" gap="$2">
            <Users size={16} color="$color11" />
            <Text fontSize="$4" color="$color11">
              {employer.industries.name}
            </Text>
          </XStack>
        </YStack>
      )}

      {/* Description */}
      {employer.description && (
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            About
          </Text>
          <Text fontSize="$4" color="$color11">
            {typeof employer.description === 'string'
              ? employer.description
              : extractPlainText(employer.description as JSONContent)}
          </Text>
        </YStack>
      )}

      {/* Location */}
      {employer.address && (
        <YStack gap="$2">
          <XStack items="center" gap="$2">
            <MapPin size={18} color="$color10" />
            <Text fontSize="$5" fontWeight="600">
              Location
            </Text>
          </XStack>
          <Text fontSize="$4" color="$color11">
            {employer.address.street || employer.address.zipCode || 'Not specified'}
          </Text>
        </YStack>
      )}

      {/* Website */}
      {websiteUrl && (
        <YStack gap="$2">
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
        </YStack>
      )}

      {/* Additional Info */}
      <YStack gap="$2">
        <Text fontSize="$3" color="$color10">
          Created: {new Date(employer.created_at).toLocaleDateString()}
        </Text>
      </YStack>
    </DashboardWidget>
  )
}
