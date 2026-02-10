import { DiscoverCard, extractPlainText } from '@unicornlove/beyond-ui'
import { Building2, ExternalLink, MapPin, Users } from '@tamagui/lucide-icons'
import type { JSONContent } from '@tiptap/core'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'

export interface Employer {
  id: string
  name: string
  slug: string
  description: JSONContent | string | null
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
    <DiscoverCard onPress={() => onViewDetails(employer)}>
      <Stack gap="$3">
        {/* Header */}
        <Row justifyContent="space-between" alignItems="flex-start" gap="$3">
          <Stack flex={1} gap="$2">
            <Row alignItems="center" gap="$2">
              <Building2 size={20} color="$blue10" />
              <Text fontSize="$6" fontWeight="700" color="$color12">
                {employer.name}
              </Text>
            </Row>

            {employer.industries && (
              <Text fontSize="$3" color="$blue10" fontWeight="600">
                {employer.industries.name}
              </Text>
            )}
          </Stack>
        </Row>

        {/* Description */}
        {employer.description && (
          <Text fontSize="$4" color="$color11" numberOfLines={3}>
            {typeof employer.description === 'string'
              ? employer.description
              : extractPlainText(employer.description as JSONContent)}
          </Text>
        )}

        {/* Details */}
        <Stack gap="$2">
          {location && (
            <Row alignItems="center" gap="$2">
              <MapPin size={16} color="$color10" />
              <Text fontSize="$3" color="$color11">
                {location}
              </Text>
            </Row>
          )}

          {employer.employee_count_range && (
            <Row alignItems="center" gap="$2">
              <Users size={16} color="$color10" />
              <Text fontSize="$3" color="$color11">
                {employer.employee_count_range} employees
              </Text>
            </Row>
          )}

          {employer.website_url && (
            <Row alignItems="center" gap="$2">
              <ExternalLink size={16} color="$color10" />
              <Text fontSize="$3" color="$blue10" numberOfLines={1}>
                {employer.website_url.replace(/^https?:\/\//, '')}
              </Text>
            </Row>
          )}
        </Stack>
      </Stack>
    </DiscoverCard>
  )
}
