import { DiscoverCard, extractPlainText } from '@unicornlove/beyond-ui'
import { Building2, ExternalLink, MapPin, Users } from 'lucide-react-native'
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
      <Stack gap={12}>
        {/* Header */}
        <Row justify="space-between" align="flex-start" gap={12}>
          <Stack flex={1} gap={8}>
            <Row align="center" gap={8}>
              <Building2 size={20} color="$blue10" />
              <Text color="gray">{employer.name}</Text>
            </Row>

            {employer.industries && <Text color="$blue10">{employer.industries.name}</Text>}
          </Stack>
        </Row>

        {/* Description */}
        {employer.description && (
          <Text color="gray" numberOfLines={3}>
            {typeof employer.description === 'string'
              ? employer.description
              : extractPlainText(employer.description as JSONContent)}
          </Text>
        )}

        {/* Details */}
        <Stack gap={8}>
          {location && (
            <Row align="center" gap={8}>
              <MapPin size={16} color="gray" />
              <Text color="gray">{location}</Text>
            </Row>
          )}

          {employer.employee_count_range && (
            <Row align="center" gap={8}>
              <Users size={16} color="gray" />
              <Text color="gray">{employer.employee_count_range} employees</Text>
            </Row>
          )}

          {employer.website_url && (
            <Row align="center" gap={8}>
              <ExternalLink size={16} color="gray" />
              <Text color="$blue10" numberOfLines={1}>
                {employer.website_url.replace(/^https?:\/\//, '')}
              </Text>
            </Row>
          )}
        </Stack>
      </Stack>
    </DiscoverCard>
  )
}
