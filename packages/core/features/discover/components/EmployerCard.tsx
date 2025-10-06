import { Card, XStack, YStack, Text, Button } from 'tamagui'
import { Building2, MapPin, Users, ExternalLink } from '@tamagui/lucide-icons'

export interface Employer {
  id: string
  name: string
  slug: string
  description: string | null
  website_url: string | null
  employee_count_range: string | null
  annual_revenue_range: string | null
  address: {
    street?: string
    zipCode?: string
  } | null
  industries: {
    id: string
    name: string
  } | null
  created_at: string
}

interface EmployerCardProps {
  employer: Employer
  onViewDetails: (employer: Employer) => void
}

/**
 * Employer Card Component
 * Displays employer information in a card format
 */
export function EmployerCard({ employer, onViewDetails }: EmployerCardProps) {
  const location = employer.address?.street || employer.address?.zipCode || 'Location not specified'

  return (
    <Card
      elevate
      bordered
      p="$4"
      bg="$background"
      hoverStyle={{ bg: '$backgroundHover', borderColor: '$borderColorHover' }}
      pressStyle={{ bg: '$backgroundPress' }}
      cursor="pointer"
      onPress={() => onViewDetails(employer)}
    >
      <YStack gap="$3">
        {/* Header */}
        <XStack justify="space-between" items="flex-start" gap="$3">
          <YStack flex={1} gap="$2">
            <XStack items="center" gap="$2">
              <Building2 size={20} color="$blue10" />
              <Text fontSize="$6" fontWeight="700" color="$color12">
                {employer.name}
              </Text>
            </XStack>

            {employer.industries && (
              <Text fontSize="$3" color="$blue10" fontWeight="600">
                {employer.industries.name}
              </Text>
            )}
          </YStack>
        </XStack>

        {/* Description */}
        {employer.description && (
          <Text fontSize="$4" color="$color11" numberOfLines={3}>
            {employer.description}
          </Text>
        )}

        {/* Details */}
        <YStack gap="$2">
          {location && (
            <XStack items="center" gap="$2">
              <MapPin size={16} color="$color10" />
              <Text fontSize="$3" color="$color11">
                {location}
              </Text>
            </XStack>
          )}

          {employer.employee_count_range && (
            <XStack items="center" gap="$2">
              <Users size={16} color="$color10" />
              <Text fontSize="$3" color="$color11">
                {employer.employee_count_range} employees
              </Text>
            </XStack>
          )}

          {employer.website_url && (
            <XStack items="center" gap="$2">
              <ExternalLink size={16} color="$color10" />
              <Text fontSize="$3" color="$blue10" numberOfLines={1}>
                {employer.website_url.replace(/^https?:\/\//, '')}
              </Text>
            </XStack>
          )}
        </YStack>

        {/* Actions */}
        <XStack gap="$2" pt="$2">
          <Button flex={1} size="$3" theme="blue" onPress={() => onViewDetails(employer)}>
            View Details
          </Button>
        </XStack>
      </YStack>
    </Card>
  )
}
