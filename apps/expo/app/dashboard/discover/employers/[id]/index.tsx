import { YStack, XStack, Text, Button, Spinner, Separator } from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  ExternalLink,
  DollarSign,
} from '@tamagui/lucide-icons'
import { api } from '@app/core/utils/api'
import { DashboardWidget } from '@app/ui'
import { extractPlainText } from '@app/ui'
import type { JSONContent } from '@tiptap/core'

export default function EmployerDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: employer, isLoading } = api.employers.getEmployerById.useQuery(
    { id: id || '' },
    { enabled: !!id }
  )

  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8">
          <Spinner size="large" />
          <Text mt="$4" color="$color11">
            Loading employer details...
          </Text>
        </YStack>
      </DashboardWidget>
    )
  }

  if (!employer) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Text color="$red10" fontSize="$5" fontWeight="600">
            Employer not found
          </Text>
          <Button onPress={() => router.back()}>Go Back</Button>
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
    <DashboardWidget>
      <YStack gap="$4">
        {/* Header with Back Button */}
        <XStack items="center" gap="$3">
          <Button
            size="$3"
            variant="outlined"
            icon={<ArrowLeft size={18} />}
            onPress={() => router.back()}
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
            <Text fontSize="$4" color="$color11">
              {employer.industries.name}
            </Text>
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
              icon={<ExternalLink size={18} />}
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
      </YStack>
    </DashboardWidget>
  )
}

